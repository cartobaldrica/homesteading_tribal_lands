let map;

L.TopoJSON = L.GeoJSON.extend({
    addData: function (jsonData) {
        if (jsonData.type === 'Topology') {
            for (this.key in jsonData.objects) {
                var geojson = topojson.feature(jsonData, jsonData.objects[this.key]);
                L.GeoJSON.prototype.addData.call(this, geojson);
            }
        }
        else {
            L.GeoJSON.prototype.addData.call(this, jsonData);
        }
    }
});

function createMap(){
    map = L.map('map').setView([41.737, -98.818], 4);
    
    var basemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 13
    }).addTo(map);

    addData();
}

function addData(){//http://localhost:9000/geoserver/topp/gwc/demo/topp:states?gridSet=EPSG:4326&format=image/png
    //geoserver/gwc/service/tms/1.0.0/GIS:LSOA@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf
    var test = L.tileLayer('http://localhost:9000/geoserver/gwc/service/tms/1.0.0/ne%3Acoastlines@EPSG%3A900913@png/{z}/{x}/{-y}.png',{
        tms: true
    }).addTo(map);
    /*L.vectorGrid.protobuf("http://localhost:9000/geoserver/gwc/service/tms/1.0.0/topp%3Astates@EPSG%3A4326@pbf/{z}/{x}/{-y}.pbf", {
        //vectorTileLayerStyles: {}
    }).addTo(map);*/
    /*fetch("data/homesteads/mn_homesteads.json")
        .then(res => res.json())
        .then(function(data){
            L.vectorGrid.slicer(data, {
                vectorTileLayerStyles: {
                    mn_homesteads: {
                        fillOpacity:1,
                        opacity:0,
                        color:"#ff0000",
                        fill:"#ff0000",
                        weight:0.5
                    }
                }
            }).addTo(map);
        })*/
    //add states data
    fetch("data/states.json")
        .then(res => res.json())
        .then(function(data){
            statesData = data;
            L.vectorGrid.slicer(data, {
                vectorTileLayerStyles: {
                    states: {
                        fillOpacity:0,
                        color:"#ffffff",
                        weight:0.5
                    }
                }
            }).addTo(map);
            /*states = new L.TopoJSON(statesData,{
                style:function(feature){
                    return {
                        fillOpacity:0,
                        color:"#ffffff",
                        weight:0.5
                    }
                },
                interactive:false
            }).addTo(map);*/
        })
        //add native homesteads data
    fetch("data/native_homesteads.json")
        .then(res => res.json())
        .then(function(data){
            nativeHomesteads = new L.TopoJSON(data,{
                style:function(feature){
                    return {
                        fillOpacity:1,
                        fillColor:"#94b8b8",
                        opacity:1,
                        color:"#94b8b8",
                        weight:0.5
                    }
                },
                onEachFeature:function(feature,layer){
                    layer.on('click',function(){
                        document.querySelector("#selection").innerHTML = "";
                        document.querySelector("#selection").insertAdjacentHTML("beforeend","<p><b>Name: </b>" + feature.properties.Name + "</p>")
                        document.querySelector("#selection").insertAdjacentHTML("beforeend","<p><b>Date: </b>" + feature.properties.Date + "</p>")
                        document.querySelector("#selection").insertAdjacentHTML("beforeend","<p>" + feature.properties.TwpRng + " Section: " + feature.properties.Sec + ", " + feature.properties.Aliquots + "</p>")
                        document.querySelector("#selection").insertAdjacentHTML("beforeend","<a href='" + feature.properties.Link + "' target='_blank'>Link to Record</a>")
                    
                    })
                    layer.on("mouseover",function(){
                        this.setStyle({
                            fillOpacity:0.5
                        })
                    })
                    layer.on("mouseout",function(){
                        this.setStyle({
                            fillOpacity:1
                        })
                    })
                }
            }).addTo(map);
        })
}

createMap();