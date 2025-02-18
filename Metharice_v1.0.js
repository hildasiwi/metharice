
var geometry = ee.Geometry.Polygon([
  [
    [107.54360934612426, -6.404789712710004],
    [107.63845225689086, -6.404789712710004],
    [107.63845225689086, -6.3431177252595905],
    [107.54360934612426, -6.3431177252595905],
    [107.54360934612426, -6.404789712710004] 
  ]
]);
var l8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2");
var l9 = ee.ImageCollection("LANDSAT/LC09/C02/T1_L2");
var LBS_Subang = ee.FeatureCollection("projects/ee-geoinfo-brin/assets/Subang/LBS_Subang_2019");
var Subang_Desa = ee.FeatureCollection("projects/ee-geoinfo-brin/assets/Subang/Subang_Desa");
var Subang_Kab = ee.FeatureCollection("projects/ee-geoinfo-brin/assets/Subang/Subang_Kab");

var startDate, endDate, resultImage, aoi, desa, batas, aoiGeometry;

function cloudMaskLandsat(image){
  var qa = image.select('QA_PIXEL');
  var dilated = 1 << 1;
  var cirrus = 1 << 2;
  var cloud = 1 << 3;
  var shadow = 1 << 4;
  
  var mask = qa.bitwiseAnd(dilated).eq(0)
    .and(qa.bitwiseAnd(cirrus).eq(0))
    .and(qa.bitwiseAnd(cloud).eq(0))
    .and(qa.bitwiseAnd(shadow).eq(0));
    
  return image.updateMask(mask);
}


//==================================

var panel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '300px',padding: '10px',backgroundColor: '#FFFFFF'}});
Map.setCenter(113.9213, -0.7893, 5);

panel.add(ui.Label({
  value: 'Methane (CH4) Emissions from Rice Paddy in Indonesia',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: 'red', 
    margin: '0px 0px 10px 0px',
    textAlign: 'center'
  }
}));

panel.add(ui.Label({
  value: '(MethaRice)',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: 'black', 
    margin: '0px 0px 10px 75px',
    textAlign: 'center'
  }
}));

panel.add(ui.Label({
  value: 'This web application is part of the CH4Rice Project, under Asia Pacific Regional Space Agency Forum (APRSAF). It is designed to assist researchers, policymakers, and farmers in understanding methane emissions and their potential impact on agriculture and climate. ',
  style: {
    fontWeight: 'italic',
    fontSize: '12px', 
    color: '#000',
    margin: '5px 5px 5px 0px'
  }
}));

panel.add(ui.Label({
  value: 'Click here to Read USER GUIDE',
  style: {
    fontWeight: 'bold',
    fontSize: '10px',
    color: '#333',
    margin: '5px 0px 0px 0px'
  },
  targetUrl: 'https://docs.google.com/document/d/1FDxIxbfNwqk3QQykVfYD7UQbemgk5lGUHvj-zGbgYDA/edit?usp=sharing'
}));

panel.add(ui.Label({
  value: '-----------------------------------------------------------------',
  style: {
    fontWeight: 'bold',
    fontSize: '10px', 
    color: '#818181',
    margin: '5px 0px'
  }
}));

var startDateInput = createLabeledInput('Start Date :', '2024-04-01');
var endDateInput = createLabeledInput('End Date   :', '2024-04-30');

panel.add(ui.Label({
  value: '1) Select start date and end date of the data',
  style: { fontWeight: 'bold', fontSize: '12px', color: '#000',margin: '5px 0px'}
}));

panel.add(ui.Label({
  value: '*Only available from 2021-10-31 until now ',
  style: {fontStyle: 'italic',fontSize: '11px',color: '#000',margin: '2px 10px'}}));

panel.add(ui.Label({
  value: '*Format Date (YYYY-MM-DD)',
  style: {fontStyle: 'italic',fontSize: '11px',color: '#000',margin: '2px 10px'}}));

panel.add(startDateInput.panel);
panel.add(endDateInput.panel);

panel.add(ui.Label({
  value: '2) Choose Location',
  style: { 
    fontWeight: 'bold', 
    fontSize: '12px', 
    color: '#000', 
    margin: '15px 0px 5px 0px' 
  }
}));

var locationSelect = ui.Select({
  items: ['Subang'], // Akan ditambah lagi
  value: 'Subang',
  style: { 
    width: '250px',
    margin: '0px 0px 10px 0px' 
  }
}); 
panel.add(locationSelect);


panel.add(ui.Label({
  value: '3) Choose the Vegetation Index',
  style: {
    fontWeight: 'bold',
    fontSize: '12px',
    margin: '15px 0px 5px 0px',
    color: '#000'
  }
}));
var indexSelect = ui.Select({
  items: ['NDVI', 'EVI2'],
  value: 'NDVI',
  style: {
    width: '250px',
    margin: '0px 0px 10px 0px'
  }
});
panel.add(indexSelect);

panel.add(ui.Label({
  value: '4) Calculate Methane (CH₄)',
  style: {
    fontWeight: 'bold',
    fontSize: '12px',
    margin: '15px 0px 5px 0px',
    color: '#000'
  }
}));

var calculateButton = ui.Button({
  label: 'Start Calculate',
  style: {
    color: 'red',
    width: '250px',
    margin: '0px 0px 10px 0px'
  },
  onClick: function() {
    var start = startDateInput.textbox.getValue();
    var end = endDateInput.textbox.getValue();
    var index = indexSelect.getValue();
    var aoi = locationSelect.getValue();
    processLandsatData(start, end, index, aoi);
  }
});
panel.add(calculateButton);

panel.add(ui.Label({
  value: '*If the data is not displayed, it is likely due to the influence of cloud cover. Consider using a longer dataset.',
  style: {
    fontWeight: 'bold',
    fontSize: '10px',
    fontStyle: 'italic',
    margin: '10px 0px',
    color: 'green'
  }
}));

panel.add(ui.Label({
  value: '*Calculations and layer loading may take some time depending on spatial and temporal resolutions selected',
  style: {
    fontWeight: 'bold',
    fontSize: '10px',
    fontStyle: 'italic',
    margin: '0px 0px',
    color: 'green'
  }
}));

panel.add(ui.Label({
  value: '------------------------------------------------------------',
  style: {
    fontWeight: 'bold',
    fontSize: '11px',  
    color: '#999',
    margin: '10px 0px'
  }
}));

panel.add(ui.Label({
  value: 'Pratikasiwi, H. A.; Rahmi, K. I. N.; Parwati; Arief, R.; Novresiandi, D. A.; Handika R; Adriany, T. A.; Cahyana, D.' ,
  style: {
    fontWeight: 'bold',
    fontSize: '10px',
    color: '#333',
    margin: '5px 0px 0px 0px'
  }
}));

panel.add(ui.Label({
  value: 'Methods by Rahmi, K.I.N. et.al.',
  style: {
    fontWeight: 'bold',
    fontSize: '10px',
    color: '#333',
    margin: '5px 0px 0px 0px'
  },
  targetUrl: 'https://drive.google.com/file/d/1vN8FXiXE87_Vnt_-uLBtuY_Enj277cWa/view?usp=sharing'
}));


panel.add(ui.Label({
  value: 'version v1.0',
  style: {
    fontWeight: 'italic',
    fontSize: '10px', 
    color: '#333',
    margin: '5px 5px 5px 200px'
  }
}));

ui.root.insert(0, panel);

//=================================================================


function processLandsatData(startDate, endDate, indexType, aoi) {
      if (aoi === 'Subang') {
      aoi = LBS_Subang;
      desa = Subang_Desa;
      batas = Subang_Kab.style({color:'black', fillColor:'#FFFFFF00'});
      aoiGeometry = aoi.geometry();
    }
  
  print(aoi);
  var landsat8 = l8
    .filterBounds(aoi)
    .filterDate(startDate, endDate);
  var landsat9 = l9
    .filterBounds(aoi)
    .filterDate(startDate, endDate);
  
  var landsat = landsat8.merge(landsat9)
    .map(cloudMaskLandsat)
    .median()
    .multiply(0.0000275).add(-0.2)
    .clip(aoi);

  Map.clear();
  var palette = ['#ffffff', '#ffcccc', '#ff9999', '#ff6666', '#ff3333', 
                   '#ff0000', '#cc0000', '#990000', '#660000', '#330000'];
  Map.addLayer(batas, {},'Subang Boundary');
  
  var methaneEmission;
  
  if (indexType === 'EVI2') {
    var evi = landsat.expression(
      '2.5 * ((NIR - RED) / (NIR + 2.4 * RED + 1))', {
        'NIR': landsat.select('SR_B5'),
        'RED': landsat.select('SR_B4')
      }).rename('EVI2');

    resultImage = evi.expression(
      '536.72 * EVI - 156.54', {
        'EVI': evi
      }).rename('Methane_EVI2');

    methaneEmission = resultImage.where(resultImage.lt(0), 0);

    Map.addLayer(methaneEmission, {min: 0, max: 200, palette: palette}, 'Methane EVI2');
    print('Methane (EVI2):', methaneEmission);
  
  } else if (indexType === 'NDVI') {
    var ndvi = landsat.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');

    resultImage = ndvi.expression(
      '321.99 * NDVI - 158.12', {
        'NDVI': ndvi
      }).rename('Methane_NDVI');

    methaneEmission = resultImage.where(resultImage.lt(0), 0);

    Map.addLayer(methaneEmission, {min: 0, max: 200, palette: palette}, 'Methane NDVI');
    print('Methane (NDVI):', methaneEmission);
  }
    var legendPanel = addLegend(palette, startDate, endDate);
    Map.add(legendPanel);Map.setControlVisibility(1);
    Map.centerObject(aoi);
    
    Export.image.toDrive({
    image: methaneEmission,
    description: 'CH4_' + indexType + '_' + startDate + '_' + endDate,
    folder: 'CH4',
    fileNamePrefix: 'CH4_' + indexType + '_' + startDate + '_' + endDate,
    region: aoi.geometry().bounds(),
    scale: 30, 
    maxPixels: 1e13
  });

var infoPanel = ui.Panel({style: {width: '300px', backgroundColor: '#FFFFFF'}});
infoPanel.add(ui.Label('Click on the map to see information'));
Map.add(infoPanel);

Map.onClick(function(coords) {
  var lon = coords.lon;
  var lat = coords.lat;
  if (!aoiGeometry.contains(point, ee.ErrorMargin(1)).getInfo()) {
    infoPanel.clear();
    infoPanel.add(ui.Label('Point is outside the study area.'));
    return;
  }
  var outerCircle = point.buffer(30); 
  var innerCircle = point.buffer(15);
  var dropBody = outerCircle.difference(innerCircle);
  var markerTail = ee.Geometry.LineString([
    [lon, lat - 0.0001],[lon, lat + 0.0001]]).buffer(5);
  var waterDrop = dropBody.union(markerTail);
  Map.layers().forEach(function(layer) {
    if (layer.getName() === 'Clicked Location') {
      Map.remove(layer);
    }
  });
  
  Map.addLayer(waterDrop, {color: 'blue'}, 'Clicked Location');

  var methaneValue = methaneEmission.sample(point, 30).first().get(resultImage.bandNames().get(0));
  var desaFeature = desa.filterBounds(point).first();
  var desaName = desaFeature.get('WADMKD'); 
  var kecamatanName = desaFeature.get('WADMKC');
  methaneValue.evaluate(function(value) {
    desaName.evaluate(function(desaVal) {
      kecamatanName.evaluate(function(kecVal) {
        infoPanel.clear();
        infoPanel.add(ui.Label({value: 'Coordinates : ' + lat.toFixed(7) + ',' + lon.toFixed(7), style: { fontSize: '14px', color: '#000',margin: '5px 0px'}}));
        if (desaVal !== null) {
          infoPanel.add(ui.Label({value: 'Desa : ' + desaVal ,style: { fontSize: '14px', color: '#000',margin: '5px 0px'}}));
        } else {
          infoPanel.add(ui.Label({value:'Desa: No data available.',style: { fontSize: '14px', color: '#000',margin: '5px 0px'}}));
        }
        if (kecVal !== null) {
          infoPanel.add(ui.Label({value: 'Kecamatan : ' + kecVal,style: { fontSize: '14px', color: '#000',margin: '5px 0px'}}));
        } else {
          infoPanel.add(ui.Label({value: 'Kecamatan: No data available.',style: { fontSize: '14px', color: '#000',margin: '5px 0px'}}));
        }
        if (value !== null) {
          infoPanel.add(ui.Label({value:'Methane Emission: ' + value.toFixed(2) + ' mg/day',style: { fontSize: '14px', color: '#000',margin: '5px 0px'}}));
        } else {
          infoPanel.add(ui.Label({value:'Methane Emission: No data available.',style: { fontSize: '14px', color: '#000',margin: '5px 0px'}}));
        }
        });
      });
    });
  });
}

//================================================


function addLegend(palette, startDate, endDate) {
  var legendPanel = ui.Panel({
    style: {
      position: 'top-left',
      padding: '8px',
      backgroundColor: '#ffffff',
      border: '1px solid #cccccc',
      width: '170px'
    }
  });

  var legendTitle = ui.Label({
    value: 'Methane Emissions (mg/day)',
    style: {
      fontWeight: 'bold',
      fontSize: '13px',
      margin: '0 0 4px 0',
      color: '#333',
      width: '150px',
      textAlign: 'center'
    }
  });

  var legendDate = ui.Label({
  value: startDate + ' - ' + endDate,
  style: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#333',
    margin: '4px 0 4px 0',
    width: '150px',
    textAlign: 'center'
  }
  });

  legendPanel.add(legendTitle);
  legendPanel.add(legendDate);

  var maxConcentration = 200; 
  var step = 20; 
  var numberOfSteps = Math.floor(maxConcentration / step);
  var colorStep = Math.floor(palette.length / numberOfSteps);

  for (var i = 0; i <= numberOfSteps; i++) {
    var concentrationValue = i * step;
    var colorIndex = Math.min(i * colorStep, palette.length - 1);

    var colorBox = ui.Label({
      style: {
        backgroundColor: palette[colorIndex],
        width: '20px',
        height: '20px',
        margin: '5px 5px 0 20px',
        padding: '0',
        
      }
    });

    var label = ui.Label({
      value: concentrationValue,
      style: {
        fontSize: '12px',
        margin: '8px 0px 0 5px'
      }
    });

    var legendItem = ui.Panel({
      widgets: [colorBox, label],
      layout: ui.Panel.Layout.Flow('horizontal')
    });

    legendPanel.add(legendItem);
  }

  return legendPanel;
}

function createLabeledInput(labelText, defaultValue) {
  var panel = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
    style: { margin: '5px 0', width: '100%' }
  });

  var label = ui.Label({
    value: labelText,
    style: {
      fontWeight: 'bold',
      fontSize: '11px',
      color: '#000',
      margin: '5px 10px 0 0',
      width: '60px' 
    }
  });

  var textbox = ui.Textbox({
    value: defaultValue,
    style: {
      margin: '0 10px 0 0',
      width: '100px'
    }
  });

  panel.add(label);
  panel.add(textbox);

  return { panel: panel, textbox: textbox };
}