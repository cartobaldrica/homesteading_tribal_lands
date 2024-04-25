//let map, tribalNations = [], homesteadData, tribalLand;
let map, homesteadOverview, homestead, homesteadData, landSeizure, landSeizureData, nativePop, statesData, states, currentState, currentStateCode, year = 1862, min, max;

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

    createHomesteadOverview();
    addData();
}
//fetch and parse state-by-state homestead data
function createHomesteadOverview(){
    fetch("data/homestead_overview.csv")
        .then(res => res.text())
        .then(function(data){
            let config = {
                header: true
            }
            
            homesteadOverview = Papa.parse(data,config).data;
        })
}

function addData(){
    //add tribal land data, then hide on initial view
    fetch("data/land_seizure.json")
        .then(res => res.json())
        .then(function(data){
            landSeizureData = data;
            landSeizure = new L.TopoJSON(landSeizureData,{
                style:function(feature){
                    return {
                        fillColor:"#94b8b8",
                        fillOpacity:0,
                        color:"#ffffff",
                        weight:0
                    }
                },
                interactive:false
            }).addTo(map);
        })
    //add native population data, then hide on initial view
    fetch("data/native_population_points.json")
        .then(function(response){
            return response.json();
        })
        .then(function(data){
            nativePop = L.geoJson(data,{
                pointToLayer:function(feature, latLng){
                    let options = {
                        fillColor:"#ffff00",
                        fillOpacity:0,
                        opacity:0,
                        radius:3,
                        interactive:false,
                        pane:'markerPane'
                    }
                    return L.circleMarker(latLng, options)
                }
            }).addTo(map);
        })
    /*fetch("data/tribal_land_2023.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(data){
            let tribalLand = L.geoJson(data,{
                style:function(feature){
                    return{
                        fillOpacity:0,
                        color:"#ffff00",
                        opacity:1,
                        weight:1,
                        dashArray:"2 2"
                    }
                }
            }).addTo(map);
        })
    */
    //add states data
    fetch("data/states.json")
        .then(res => res.json())
        .then(function(data){
            statesData = data;
            states = new L.TopoJSON(statesData,{
                style:function(feature){
                    return {
                        fillColor:setColor(),
                        fillOpacity:1,
                        color:"#ffffff",
                        weight:0.5
                    }
                    function setColor(){
                        return feature.properties.homestead == 1 ? "#333333": "#000000";
                    }
                },
                onEachFeature:function(feature,layer){
                    
                    //style on hover
                    if (feature.properties.homestead == 1){
                        /*layer.bindTooltip(feature.properties.STUSPS,{
                            permanent:true
                        })*/
                        
                        layer.on('mouseover',function(){
                            layer.setStyle({
                                fillColor:"#e6e6e6"
                            })
                        })
                        layer.on('mouseout',function(){
                            layer.setStyle({
                                fillColor:"#333333"
                            })
                        })
                        //zoom to state on click
                        layer.on('click',function(){
                            createHomesteads(feature.properties)
                            
                            let bounds = layer.getBounds();
                            map.fitBounds(bounds)
                        })
                    }
                }
            }).addTo(map);
        })

    /*fetch("data/mn_reservation_homesteads.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(data){
            homesteadData = data;
            createHomesteads("All Nations");
        })
    
    selectNation();*/
}
//create homesteads
function createHomesteads(state){
    currentStateCode = state["STUSPS"];
    //remove select a state text
    document.querySelector("#state-selection").style.display = "none";
    //remove states layer from map
    map.removeLayer(states);
    //add outline of selected state
    currentState = new L.TopoJSON(statesData,{
        style:function(feature){
            return {
                fillColor:"#333333",
                fillOpacity:1,
                color:"#ffffff",
                weight:0.5
            }
        },
        filter:function(feature){
            return feature.properties["STUSPS"] == state["STUSPS"] ? true: false;
        },
        pane:'tilePane'
    }).addTo(map)
    //add homestead data
    fetch("data/homesteads/" + state["STUSPS"] + "_homesteads.json")
        .then(res => res.json())
        .then(function(data){
            homesteadData = data;
            addHomesteadLayer();
        })
        //to do: mn loads too slowly for the timeline populate
        .then(function(){
            createTimeline();
            createOverview(state);
        })

}
//add homestead layer
function addHomesteadLayer(){
    if(homestead){
        map.removeLayer(homestead)
        homestead = null;
    }

    homestead = new L.TopoJSON(homesteadData,{
        style:function(feature){
            return {
                fillColor:setColor(feature),
                color:setColor(feature),
                fillOpacity:1,
                opacity:1,
                weight:0.5
            }
        },
        filter:function(feature){
            //get last four digits of date attribute
            let featureYear = feature.properties.date.substr(feature.properties.date.length - 4)
            //sometimes, the last four digits of the attribute only include the full year for dates in the 1800s, and switch to a 2 digit year after 1900
            //if last four digits of date attribute include a slash or dash, take the last 2 digits and combine with 19 to get the full year.
            featureYear = featureYear.indexOf('/') > -1 ? '19' + featureYear.substr(2) : featureYear.indexOf('-') > -1 ? '19' + featureYear.substr(2) : featureYear;

            if (min)
                min = featureYear < min ? feature.properties.date.substr(feature.properties.date.length - 4): min;
            else    
                min = featureYear
            //get maximum value
            /*if (max)    
                max = featureYear > max ? featureYear: max;
            else    
                max = featureYear*/
            //set maximum value to 1930
            max = 1930
            min = 1862
            
            return featureYear <= year ? true: false;
        },
        pane:'shadowPane'
    }).addTo(map);

    function setColor(feature){
        let featureYear = feature.properties.date.substr(feature.properties.date.length - 4)
        return featureYear == year ? "#cc0052": "#ff66a3";
    }
    //add seizure data
    restyleSeizureData();
    restyleNativePop();
}
//show tribal lands for selected state
function restyleSeizureData(){
    //restyle tribal land data
    landSeizure.eachLayer(function(layer){
        layer.setStyle({
            fillOpacity:setOpacity(layer.feature),
            opacity:setOpacity(layer.feature)
        })
    })
    //hide tribal land outside the current state
    function setOpacity(feature){
        return (feature.properties.sYear <= year && feature.properties.eYear >= year) && (feature.properties.states.includes(currentStateCode)) ? 1: 0;
    }
}
//show native population for selected state
function restyleNativePop(){
    //restyle native population data
    nativePop.eachLayer(function(layer){
        layer.setStyle({
            fillOpacity:setOpacity(layer.feature),
            radius:setRadius(layer.feature)
        })
    })
    //hide native population outside the current state
    function setOpacity(feature){
        return currentStateCode == feature.properties.stusps ? 0.7: 0;
    }
    //calculate radius for each features
    function setRadius(feature){
        let minRadius = 2;
        console.log(feature.properties.native_pop)
        var radius = 1.0083 * Math.pow(feature.properties.native_pop / 1000, 0.5715) * minRadius;
    
        return radius;
    }
}
//create timeline interface
function createTimeline(){
    //add dropdown menu
    document.querySelector('#selection').insertAdjacentHTML('beforeend','<p>Selected Year: <select id="year-dropdown"></selection></p>')
    for (var i = min; i <= max; i++){
        document.querySelector("#year-dropdown").insertAdjacentHTML('beforeend','<option id="year-dropdown">' + i + '</option>')
    }

    //add previous step button
    document.querySelector('#selection').insertAdjacentHTML('beforeend','<button class="step" id="reverse"><</button>');
    
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range' list='values'></input><datalist id='values'></datalist>";
    document.querySelector("#selection").insertAdjacentHTML('beforeend',slider);

    //set slider attributes
    document.querySelector(".range-slider").max = max;
    document.querySelector(".range-slider").min = min;
    document.querySelector(".range-slider").value = min;
    document.querySelector(".range-slider").step = 1;

    //add ticks to the timelines
    document.querySelector("#values").insertAdjacentHTML("beforeend","<option value='1880' label='1880'></option>")
    document.querySelector("#values").insertAdjacentHTML("beforeend","<option value='1900' label='1900'></option>")
    document.querySelector("#values").insertAdjacentHTML("beforeend","<option value='1920' label='1920'></option>")
    document.querySelector("#values").insertAdjacentHTML("beforeend","<option value='1940' label='1940'></option>")
    document.querySelector("#values").insertAdjacentHTML("beforeend","<option value='1960' label='1960'></option>")


    //add next step button
    document.querySelector('#selection').insertAdjacentHTML('beforeend','<button class="step" id="forward">></button>');

    //update value
    //on button click
    var steps = document.querySelectorAll('.step');
    steps.forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
            //increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //if past the last attribute, wrap around to first attribute
                index = index > max ? min : index;
            } else if (step.id == 'reverse'){
                index--;
                //if past the first attribute, wrap around to last attribute
                index = index < min ? max : index;
            };
            //update slider value
            year = index;
            document.querySelector('.range-slider').value = index;
            //update dropdown
            document.querySelector("#year-dropdown").value = year;
            //add homestead data to map
            addHomesteadLayer();
        })
    })
    //using slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //set new year value
        year = this.value;
        document.querySelector("#year-dropdown").value = year;
        //add homestead data to map
        addHomesteadLayer();
    });
    //using dropdown menu
    document.querySelector("#year-dropdown").addEventListener("change",function(){
        //set new year value
        year = this.value;
        document.querySelector('.range-slider').value = year;
        //add homestead data to map
        addHomesteadLayer();
    })
}
//create state overview
function createOverview(state){
    let stateOverview;
    //get state record from the the overview object
    homesteadOverview.forEach(function(data){
        if (state["STUSPS"] == data["state"])
            stateOverview = data;
    })
    let percentage = ((Number(stateOverview["mapped"])/Number(stateOverview["total"])) * 100).toFixed(2);
    //create string with minimum and maximum date
    //document.querySelector("#selection").insertAdjacentHTML("afterbegin","<p>Homestead parcels in <b>" + state["NAME"] + "</b> were acquired between <b>" + min + "</b> and <b>" + max + ".</b></p>")
    //create string with overall homestead statistics
    document.querySelector("#selection").insertAdjacentHTML("afterbegin","<p>In <b>" + state["NAME"] + "</b>, <b>" + Number(stateOverview["total"]).toLocaleString() + "</b> parcels were acquired through the <b>1862 Homestead Act</b>. This map shows <b>" + Number(stateOverview["mapped"]).toLocaleString() + "</b> parcels, <b>" + percentage + "%</b> of the total.")
    //add reset button
    document.querySelector('#selection').insertAdjacentHTML('afterbegin','<button id="reset">Reset Map</button>');
    document.querySelector('#reset').addEventListener("click",function(elem){
        resetInterface();
    })
    //add legend elements
    document.querySelector("#selection").insertAdjacentHTML("beforeend","<p><b class='legend-block' id='tribal-lands' style='background:#94b8b8'></b>Tribal Lands</p>")
    document.querySelector("#selection").insertAdjacentHTML("beforeend","<p class='parcel-legend'><b>Homestead Parcels</b></p>")
    document.querySelector("#selection").insertAdjacentHTML("beforeend","<p class='parcel-legend'><b class='legend-block' style='background:#cc0052'></b>Current Year</p>")
    document.querySelector("#selection").insertAdjacentHTML("beforeend","<p class='parcel-legend'><b class='legend-block' style='background:#ff66a3'></b>Previous Years</p>")

}

function resetInterface(){
    //clear sidebar
    document.querySelector("#selection").innerHTML = "";
    //remove layers
    map.removeLayer(homestead);
    map.removeLayer(currentState);
    //add states to map
    states.addTo(map);
    states.resetStyle();
    //hide population
    nativePop.resetStyle();
    //reset view
    map.setView([41.737, -98.818], 4);
    //reset year
    year = 1862;
    //reset min and max values
    min = null, max = null;
    //add state selection text
    document.querySelector("#state-selection").style.display = "block";
}

/*function createHomesteads(value){
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
*/
document.addEventListener("DOMContentLoaded", createMap)
