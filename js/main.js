let map, tribalNations = [], homesteadData, tribalLand;

function createMap(){
    map = L.map('map').setView([46.737, -92.818], 8);
    
    var basemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 13
    }).addTo(map);

    addData();
}

function addData(){
    fetch("data/tribal_land_2023.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(data){
            let tribalLand = L.geoJson(data,{
                style:function(feature){
                    return{
                        fillColor:"#d6d6c2",
                        fillOpacity:0.5,
                        color:"#7a7a52",
                        opacity:1,
                        weight:1
                    }
                },
                onEachFeature:function(feature,layer){
                    let option = feature.properties.name;
                    if (!tribalNations.includes(option)){
                        tribalNations.push(option)
                        document.querySelector("#tribal-nation").insertAdjacentHTML("beforeend","<option value='" + option + "'>" + option + "</option>")
                    }
                }
            }).addTo(map);
        })
    fetch("data/mn_reservation_homesteads.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(data){
            homesteadData = data;
            createHomesteads("All Nations");
        })
    
    selectNation();
}

function createHomesteads(value){
    tribalLand = L.geoJson(homesteadData,{
        style:function(feature){
            return{
                fillColor:"#c65353",
                fillOpacity:0.5,
                color:"#862d2d",
                opacity:1,
                weight:1
            }
        },
        filter:function(feature){
            if (feature.properties.nation == value || value == "All Nations")
                return true;
            else    
                return false; 
        },
        onEachFeature:function(feature,layer){
            layer.on('click',function(){
                document.querySelector("#selection").innerHTML = "";
                document.querySelector("#selection").insertAdjacentHTML("beforeend","<p><b>Name: </b>" + feature.properties.name + "</p>")
                document.querySelector("#selection").insertAdjacentHTML("beforeend","<p><b>Date: </b>" + feature.properties.date + "</p>")
                document.querySelector("#selection").insertAdjacentHTML("beforeend","<p>" + feature.properties.twprng + " Section: " + feature.properties.sec + ", " + feature.properties.aliquots + "</p>")
                document.querySelector("#selection").insertAdjacentHTML("beforeend","<a href='" + feature.properties.LINK + "' target='_blank'>Link to Record</a>")
            
            })
            layer.on("mouseover",function(){
                this.setStyle({
                    fillOpacity:0.9
                })
            })
            layer.on("mouseout",function(){
                this.setStyle({
                    fillOpacity:0.5
                })
            })
        }
    }).addTo(map);

    if (value == "All Nations")
        map.setView([47.237, -92.818], 8);
    else{
        let bounds = tribalLand.getBounds();
        map.fitBounds(bounds)
    }

}

function selectNation(){
    document.querySelector("#tribal-nation").addEventListener("change",function(){
        document.querySelector("#selection").innerHTML = "";

        
        let value = document.querySelector("#tribal-nation").value;
        map.removeLayer(tribalLand);
        tribalLand = null;
        createHomesteads(value);
    })
}

document.addEventListener("DOMContentLoaded", createMap)
