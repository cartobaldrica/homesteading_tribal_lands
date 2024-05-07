//let map, tribalNations = [], homesteadData, tribalLand;
let map, homesteadOverview, nativeHomestead, homestead, homesteadData, landSeizure, landSeizureData, nativePop, statesData, states, currentState, currentStateCode, year = 1862, min, max, select, legend, legendToggle, mobileTimeline, legendTogglePresent = false, overviewPresent = true, overview, info;

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
    //create map 
    map = L.map('map',{zoomControl: false, scrollWheelZoom:false}).setView([41.737, -98.818], 4);
    
    var basemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 13
    }).addTo(map);
    //move zoom control
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    createInterfaceIcons();
    createMobileTimeline();

    createSelection();

    createLegend();
    createOverviewContainer();
    createHomesteadOverview();
    addData();
}
function createInterfaceIcons(){
    info = L.control({position:'topleft'});
    info.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'icon info'); // create a div with a class "legend"
        let i = document.createElement("p");
        i.innerHTML = "<p>&#9432</p>";

        i.addEventListener("click",function(){
            if (currentState){
                if (overviewPresent == false){
                    createOverview();
                    overviewPresent = true;
                }
                else{
                    overview.remove();
                    overviewPresent = false;
                }
            }
            else{
                select.addTo(map);
                scrollArrow();
                info.remove();
            }
        })
        this._div.insertAdjacentElement("beforeend",i);

        return this._div;
    };
    //info.addTo(map)
    legendToggle = L.control({position:'bottomright'});
    legendToggle.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'icon legendToggle'); // create a div with a class "legend"
        this._div.innerHTML = "<p>&#8801</p>"

        this._div.addEventListener("click",function(){
            if (legendTogglePresent == false){
                legend.addTo(map);
                legendTogglePresent = true;
            }
            else{
                legend.remove();
                legendTogglePresent = false;
            }
        })

        return this._div;
    };
}
//create selection screen
function createSelection(){
    select = L.control({position:'topleft'});

    select.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'select'); // create a div with a class "legend"
        let button = document.createElement("button");
        button.innerHTML = "Close Window";
        button.className = "close-select";
        
        this._div.innerHTML = "<h1>Homestead Act of 1862</h1>" +
                              "<p>The Homestead Act of 1862 facilitated the transfer of vast amounts of land from the so-called 'public domain' to individual households—driving settlement across much of the Western United States. Public domain lands were all acquired from American Indian nations, through wars and treaties—which were often similarly violent and coercive. The Homestead Act is thus a key component in the larger settler-colonial project, designed to remove Native peoples from the land while simultaneously enforcing a European conception of land-as-property across the U.S.</p>"+
                              "<p>This map juxtaposes the advance of homesteading settlers with the shrinkage of the tribal land base. However, it also includes land parcels acquired through the Indian Homestead Acts of 1875 and 1884, where opened up provisions of the Homestead Act to American Indians. The Indian Homestead Acts complicate the picture of Native geographies in the second half of the 19th century, and the early part of the 20th.</p>" +
                              "<h2 class='select-state'>Select a state to begin</h2>";     
        
        this._div.insertAdjacentElement('beforeend',button);
        this._div.insertAdjacentHTML('beforeend', "<p class='arrow' alt='Scroll to Continue'><b class='blink'>&#8659</b></p>");
       
        //change direction of arrow depending on scroll
        this._div.addEventListener("scroll",function(elem){
            if (elem.target.scrollTop == elem.target.scrollTopMax)
                document.querySelector(".blink").innerHTML = "&#8657";
            else   
                document.querySelector(".blink").innerHTML = "&#8659";
        
        })
        //close window button listener
        button.addEventListener("click",function(elem){
            info.addTo(map)
            select.remove();
        })
        //hide or show flashing arrow depending on screen size
        window.addEventListener("resize",scrollArrow)
        
        return this._div;
    };

    select.addTo(map);
    scrollArrow();

}
//position scroll arrow
function scrollArrow(){
    //position scrolling arrow
    let controlHeight = document.querySelector(".select").offsetHeight,
        windowHeight = window.innerHeight;

    if ((windowHeight - controlHeight - 100) <= 0)
        document.querySelector(".arrow").style.display = "block";
    else
        document.querySelector(".arrow").style.display = "none";

}
//create legend
function createLegend(){
    legend = L.control({position:'bottomright'});

    legend.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'legend'); // create a div with a class "legend"
        this._div.innerHTML = "<p class='parcel-legend'><b class='legend-block' style='background:#94b8b8'></b>Native Lands</p>" +
            "<p class='parcel-legend'><b class='legend-block' id='tribal-lands' style='background:#527a7a'></b>Native Homestead</p>" +
            "<p class='parcel-legend'><b>Homestead Parcels</b></p>" + 
            "<p class='parcel-legend'><b class='legend-block' style='background:#cc0052'></b>Current Year</p>" +
            "<p class='parcel-legend'><b class='legend-block' style='background:#ff66a3'></b>Previous Years</p>";

        return this._div;
    };
}
//create mobile timline
function createMobileTimeline(){
    mobileTimeline = L.control({position:'bottomleft'});

    mobileTimeline.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'mobile-timeline'); // create a div with a class "legend"

        return this._div;
    };
    mobileTimeline.addTo(map);
}
//create overview
function createOverviewContainer(){
    overview = L.control({position:'topleft'});

    overview.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'overview'); // create a div with a class "legend"

        return this._div;
    };
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
                    //style on hover for states that have data
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
}
//create homesteads
function createHomesteads(state){
    currentStateCode = state["STUSPS"];
    //remove selection screen
    select.remove();
    //remove states layer from map
    map.removeLayer(states);
    //add outline of selected state
    currentState = new L.TopoJSON(statesData,{
        style:function(feature){
            return {
                fillColor:"#333333",
                fillOpacity:0,
                color:"#ffffff",
                weight:1
            }
        },
        filter:function(feature){
            return feature.properties["STUSPS"] == state["STUSPS"] ? true: false;
        },
        pane:'tilePane'
    }).addTo(map)
    //add homestead data
    homestead = L.vectorGrid.protobuf("http://localhost:9000/geoserver/gwc/service/tms/1.0.0/homestead%3A" + currentStateCode.toLowerCase() + "_homesteads@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf", {
        vectorTileLayerStyles: {
            [currentStateCode.toLowerCase() + "_homesteads"]: function(properties){
                return{   
                    fillColor:setColor(properties),
                    fillOpacity:setOpacity(properties),
                    fill:true,
                    weight:0,
                    opacity:0
                }
            }
        }
    }).addTo(map);
    //style homestead data
    function setColor(props){
        let featureYear = props.date.substr(props.date.length - 4)
        return featureYear == year ? "#cc0052": "#ff66a3";
    }
    function setOpacity(props){
        //get last four digits of date attribute
        let featureYear = props.date.substr(props.date.length - 4)
        //sometimes, the last four digits of the attribute only include the full year for dates in the 1800s, and switch to a 2 digit year after 1900
        //if last four digits of date attribute include a slash or dash, take the last 2 digits and combine with 19 to get the full year.
        featureYear = featureYear.indexOf('/') > -1 ? '19' + featureYear.substr(2) : featureYear.indexOf('-') > -1 ? '19' + featureYear.substr(2) : featureYear;
        return featureYear <= year ? 1: 0;
    }
    //add native homestead data
    nativeHomestead = L.vectorGrid.protobuf("http://localhost:9000/geoserver/gwc/service/tms/1.0.0/homestead%3Anative_homesteads@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf", {
        vectorTileLayerStyles: {
            "native_homesteads": function(properties){
                return{   
                    fillColor:"#527a7a",
                    fillOpacity:nativeHomesteadOpacity(properties),
                    fill:true,
                    weight:0,
                    opacity:0
                }
            }
        }
    }).addTo(map);
    //hide native homesteads outside of states
    function nativeHomesteadOpacity(props){
        let featureYear = props.Date.substr(props.Date.length - 4),
            stateCode = props.State;
        
            return featureYear <= year && stateCode == currentStateCode ? 1: 0;
    }
    //homestead legend
    //add legend to map
    legendToggle.addTo(map);
    if (window.screen.width >= 500){
        legend.addTo(map);
        legendTogglePresent = true;
    }

    restyleHomesteadLayer();
    createOverview();
    if (window.screen.width >= 500)
        createTimeline(".overview");
    else
        createTimeline(".mobile-timeline");

    createReset();
}
//add homestead layer
function restyleHomesteadLayer(){
    homestead.redraw();
    nativeHomestead.redraw();
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
        var radius = 1.0083 * Math.pow(feature.properties.native_pop / 1000, 0.5715) * minRadius;
    
        return radius;
    }
}
//create timeline interface
function createTimeline(element){
    let max = 1930
    let min = 1862
    
    //add dropdown menu
    document.querySelector(element).insertAdjacentHTML('beforeend','<p>Selected Year: <select id="year-dropdown"></selection></p>')
    for (var i = min; i <= max; i++){
        document.querySelector("#year-dropdown").insertAdjacentHTML('beforeend','<option id="year-dropdown">' + i + '</option>')
    }

    //add previous step button
    document.querySelector(element).insertAdjacentHTML('beforeend','<button class="step" id="reverse"><</button>');
    
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range' list='values'></input><datalist id='values'></datalist>";
    document.querySelector(element).insertAdjacentHTML('beforeend',slider);

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
    document.querySelector(element).insertAdjacentHTML('beforeend','<button class="step" id="forward">></button>');

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
            restyleHomesteadLayer();
        })
    })
    //using slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //set new year value
        year = this.value;
        document.querySelector("#year-dropdown").value = year;
        //add homestead data to map
        restyleHomesteadLayer();
    });
    //using dropdown menu
    document.querySelector("#year-dropdown").addEventListener("change",function(){
        //set new year value
        year = this.value;
        document.querySelector('.range-slider').value = year;
        //add homestead data to map
        restyleHomesteadLayer();
    })
}
//create state overview
function createOverview(){
    overview.addTo(map);
    let stateOverview;
    //get state record from the the overview object
    homesteadOverview.forEach(function(data){
        if (currentStateCode == data["state"])
            stateOverview = data;
    })
    let percentage = ((Number(stateOverview["mapped"])/Number(stateOverview["total"])) * 100).toFixed(2);
    //create string with state name
    document.querySelector(".overview").insertAdjacentHTML("beforeend","<h1>" + stateOverview["name"] + "</h1>")
    //create string with overall homestead statistics
    document.querySelector(".overview").insertAdjacentHTML("beforeend","<p>In <b>" + stateOverview["name"] + "</b>, <b>" + Number(stateOverview["total"]).toLocaleString() + "</b> parcels were acquired through the <b>1862 Homestead Act</b>. This map shows <b>" + Number(stateOverview["mapped"]).toLocaleString() + "</b> parcels, <b>" + percentage + "%</b> of the total.")


}
//create reset button
function createReset(){
    //add reset button
    if (window.screen.width >= 500)
        document.querySelector('.overview').insertAdjacentHTML('beforeend','<button id="reset">Reset Map</button>');
    else
        document.querySelector('.info').insertAdjacentHTML('beforeend','<button id="reset">Reset Map</button>');
    
    document.querySelector('#reset').addEventListener("click",function(elem){
        resetInterface();
    })
}

function resetInterface(){
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
    //remove legend and overview
    legend.remove();
    overview.remove();
    //reset current state
    currentState = null;
    //add selection screen
    if (window.screen.width >= 500){
        select.addTo(map);
        info.remove();
    }
    //clear mobile timeline
    document.querySelector(".mobile-timeline").innerHTML = "";
    document.querySelector("#reset").remove();
}
document.addEventListener("DOMContentLoaded", createMap)
