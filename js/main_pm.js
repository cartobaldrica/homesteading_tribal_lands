//toggle cessions on/off, keep reservations. should be achievable with a simple toggle and a bool
//incorporate labels of tribal presence at the time of colonization
//show/toggle native population—add light county boundaries
(function(){
    //symbol colors
    let homesteadCurrentColor = "#ff9999", homesteadPastColor = "#cc0000", nhColor = "#a3a375", reservationColor = "#e0e0d1";
    //map variables
    let map, 
        mn,wi,mi,nh,
        labels,
        treatyLand, nativePop, states, 
        year = 1862, 
        legend, legendIcon, nativePopLegend = "",
        timeline, 
        showLegend = false, showCessions = false, showNativePop = false; 
    //topojson functionality
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
        map = L.map('map',{zoomControl: false, scrollWheelZoom:false, doubleClickZoom:false}).setView([44.778,-89.319], 6);
        //move zoom control
        L.control.zoom({
            position: 'topleft'
        }).addTo(map);

        addLayers();
        //create legend
        createLegend();
        //create timeline container based on screensize
        if (window.screen.width >= 500)
            createTimelineContainer("topright");
        else
            createTimelineContainer("bottomleft");
        //create timeline control
        createTimeline(".timeline");
        layerToggle(".timeline")
    }
    //create legend
    function createLegend(){
        //create native population points for the legend
        let legendValues = [50000,10000,1000];
        nativePopLegend += "<div class='native-pop-legend-container'><p class='parcel-legend'><b>Native Pop. 2020 (1000s)</b></p>"
        legendValues.forEach(function(val,i){
            let d = setRadius(val) * 2;  
            nativePopLegend += "<div class='native-pop-legend' style='height:" + d + "px; width:" + d + "px;'></div><p class='native-pop-caption'>" + val/1000 + "</p>"
            if (i == 2)
                nativePopLegend += '</div>'
        })
        //create the legend
        legend = L.control({position:'topleft'});
        legend.onAdd = function(map) {
            this._div = L.DomUtil.create('div', 'legend'); // create a div with a class "legend"
            this._div.innerHTML = "<p class='parcel-legend'><b>Homestead Parcels</b></p>" + 
                "<p class='parcel-legend'><b class='legend-block' style='background:" + homesteadCurrentColor + "'></b>Current Year</p>" +
                "<p class='parcel-legend'><b class='legend-block' style='background:" + homesteadPastColor + "'></b>Previous Years</p>" +
                "<p class='parcel-legend'><b>Native Presence</b></p>" +
                "<p class='parcel-legend'><b class='legend-block' style='background:" + reservationColor + "'></b>Leg. Tribal Lands</p>" +
                "<p class='parcel-legend'><b class='legend-block' id='tribal-lands' style='background:" + nhColor + "'></b>Native Homestead</p>"; 

            return this._div;
        };
        //create the legend toggler
        legendIcon = L.control({position:'topleft'});
        legendIcon.onAdd = function(map) {
            this._div = L.DomUtil.create('div', 'icon legendIcon'); // create a div with a class "legend"
            this._div.innerHTML = "<p>&#8801</p>"

            this._div.addEventListener("click",function(){
                if (showLegend == false){
                    legend.addTo(map); showLegend = true;
                }
                else{
                    legend.remove(); showLegend = false;
                }
            })

            return this._div;
        };
        legendIcon.addTo(map)
        //if screen is large, show legend
        if (window.screen.width >= 500){
            legend.addTo(map);
            showLegend = true;
        }

    }
    //create timeline container
    function createTimelineContainer(position){
        timeline = L.control({position:position});

        timeline.onAdd = function(map) {
            this._div = L.DomUtil.create('div','timeline'); // create a div with a class "legend"

            return this._div;
        };
        timeline.addTo(map);
    }
    function addLayers(){
        //add treaty land data
        fetch("data/treaties.json")
            .then(res => res.json())
            .then(function(data){
                treatyLand = new L.TopoJSON(data,{
                    style:function(feature){
                        function fill(){
                            if ((feature.properties.sYear <= year && feature.properties.eYear >= year) && feature.properties.type =='reservation')
                                return reservationColor;
                            else 
                                return "rgba(255,255,255,0)"
                        }
                        function weight(){
                            if ((feature.properties.eYear <= year || feature.properties.type =='cession')&&showCessions)
                                return 0.25;
                            else 
                                return 0;
                        }
                        return {
                            fillColor:fill(),
                            fillOpacity:1,
                            color:"#ffffff",
                            weight:weight(),
                            pane:"overlayPane"
                        }
                    },
                    onEachFeature:function(feature,layer){
                        treatyFeature(layer)  
                    }
                }).addTo(map);
            })
        //add native population data
        fetch("data/native_population_points.json")
            .then(function(response){
                return response.json();
            })
            .then(function(data){
                nativePop = L.geoJson(data,{
                    pointToLayer:function(feature, latLng){
                        let options = {
                            fillColor:"#a3a3c2",
                            fillOpacity:1,
                            opacity:0,
                            radius:setRadius(feature.properties.native_pop),
                            interactive:false,
                            pane:'popupPane'
                        }
                        return L.circleMarker(latLng, options)
                    }
                });
                if (showNativePop)
                    nativePop.addTo(map)
            })
        //add state outlines
        fetch("data/states.json")
            .then(res => res.json())
            .then(function(data){
                statesData = data;
                states = new L.TopoJSON(statesData,{
                    style:function(feature){
                        function opacity(){
                            let st = feature.properties.STUSPS
                            return st == 'WI' || st == 'MN' || st == 'MI' ? 1 : 0;
                        }
                        return {
                            fillOpacity:opacity(),
                            fillColor:"#1a1a1a",
                            color:"#ffffff",
                            weight:0.5,
                            opacity:opacity(),
                            pane:"tilePane"
                        }
                    },
                    interactive:false
                }).addTo(map);
            })
        //treaty labels labels
        let treatyLabels = [
            {
                dataLayer:"treaty_points",
                symbolizer: new protomapsL.CenteredTextSymbolizer({
                        labelProps:["eYear_txt"],
                        font:(z,f) => {
                            if ((f.props.sYear <= year && f.props.type == 'cession'))
                                return "12px bold arial";
                            else 
                                return "0px bold arial";
                        },
                        fill:"#ffffff",
                        stroke:"black",
                        weight:0.5,
                        width:0,
                        lineHeight:1,
                        justify:2,
                    })
            }
        ];
        labels = protomapsL.leafletLayer({
            pane:"tooltipPane",
            url: "data/treaties_merged.pmtiles",
            labelRules:treatyLabels
        });
        //add treaty lands and labels to map
        if (showCessions)
            labels.addTo(map);
        //create homestead layers
        //homestead layer symbolizer
        let symbolizer = new protomapsL.PolygonSymbolizer({
            fill:(z,f) => {
                let homesteadYear =  f.props.date ? f.props.date.substr(f.props.date.length - 4):f.props.Date.substr(f.props.Date.length - 4)
                homesteadYear = homesteadYear.indexOf('/') > -1 ? '19' + homesteadYear.substr(2) : homesteadYear.indexOf('-') > -1 ? '19' + homesteadYear.substr(2) : homesteadYear;

                return homesteadYear == year ? homesteadCurrentColor: homesteadPastColor;
            },
            opacity:(z,f) => {
                let homesteadYear =  f.props.date ? f.props.date.substr(f.props.date.length - 4):f.props.Date.substr(f.props.Date.length - 4)
                homesteadYear = homesteadYear.indexOf('/') > -1 ? '19' + homesteadYear.substr(2) : homesteadYear.indexOf('-') > -1 ? '19' + homesteadYear.substr(2) : homesteadYear;

                return homesteadYear <= year? 1:0;
            },
            width:0
        })
        //native homestead symbolizer
        let nh_symbolizer = new protomapsL.PolygonSymbolizer({
            fill:nhColor,
            opacity:(z,f) => {
                let homesteadYear =  f.props.date ? f.props.date.substr(f.props.date.length - 4):f.props.Date.substr(f.props.Date.length - 4)
                homesteadYear = homesteadYear.indexOf('/') > -1 ? '19' + homesteadYear.substr(2) : homesteadYear.indexOf('-') > -1 ? '19' + homesteadYear.substr(2) : homesteadYear;

                return homesteadYear <= year? 1:0;
            },
            width:0
        })
        //create homestead tiles
        function createTiles(state){
            let tileSymbolizer = state == 'native_homesteads' ? nh_symbolizer: symbolizer;
           
            let tiles = protomapsL.leafletLayer({
                pane:"shadowPane",
                url: "data/" + state + ".pmtiles",
                paintRules:[
                    {
                        dataLayer:state,
                        symbolizer:tileSymbolizer
                    }
                ]
            });

            return tiles
        }   
        //create tiles for each state and native homesteads
        mn = createTiles("minnesota")
        mn.addTo(map)
        wi = createTiles("wisconsin")
        wi.addTo(map)
        mi = createTiles("Michigan")
        mi.addTo(map)
        nh = createTiles("native_homesteads")
        nh.addTo(map)

        restyleHomesteadLayers();
    }
    //add homestead layer
    function restyleHomesteadLayers(){
        mn.rerenderTiles();
        wi.rerenderTiles();
        mi.rerenderTiles();
        nh.rerenderTiles();
        labels.rerenderTiles();
    }
    //calculate radius for each native population county feature
    function setRadius(pop){
        let minRadius = 2;
        var radius = 1.0083 * Math.pow(pop / 1000, 0.5715) * minRadius;

        return radius;
    }
    //create interactivity of treaty land layer
    function treatyFeature(layer){
        if (showCessions){
            layer.on('mouseover',function(){
                if ((layer.feature.properties.eYear <= year && layer.feature.properties.type =='cession') || (layer.feature.properties.eYear <= year && layer.feature.properties.type == 'reservation')){
                    layer.setStyle({
                        weight:3
                    })
                }
                if (layer.feature.properties.eYear <= year){
                    let text = layer.feature.properties.type == 'cession' || (layer.feature.properties.type == 'reservation' && layer.feature.properties.eYear < year) ? ("<b>Cession Date:</b> " + layer.feature.properties.eYear) : layer.feature.properties.type == 'reservation' && ((layer.feature.properties.sYear < year) && (layer.feature.properties.eYear > year)) ? ("<b>Reservation Established: </b>" + layer.feature.properties.sYear ): layer.feature.properties.sYear + ", " + layer.feature.properties.eYear;
                    layer.bindPopup("<b>Present Day Tribal Nation(s):</b> " + layer.feature.properties.present_da + "</br>" + text,{className:"treaty-popup"})
                }
            })
            layer.on('mouseout',function(){
                treatyLand.resetStyle()
            })
        }
        else
            layer.off()
    }

    //create timeline interface
    function createTimeline(element){
        let max = 1930;
        let min = 1862;
        
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
                restyleHomesteadLayers();
                treatyLand.resetStyle()
                treatyLand.eachLayer(treatyFeature)
            })
        })
        //using slider
        document.querySelector('.range-slider').addEventListener('input', function(elem){
            //set new year value
            year = Number(this.value);

            document.querySelector("#year-dropdown").value = year;
            //add homestead data to map
            restyleHomesteadLayers();
            treatyLand.resetStyle()
            treatyLand.eachLayer(treatyFeature)
        });
        //using dropdown menu
        document.querySelector("#year-dropdown").addEventListener("change",function(){
            //set new year value
            year = this.value;
            document.querySelector('.range-slider').value = year;
            //add homestead data to map
            restyleHomesteadLayers();
            treatyLand.resetStyle()
            treatyLand.eachLayer(treatyFeature)
        })

    }
    
    //create layer toggle
    function layerToggle(element){
        document.querySelector(element).insertAdjacentHTML("beforeend","<div class='layer-check'><input type='checkbox' id='treaties'><label for='#treaties'>Treaty Outlines</label></div>")
        document.querySelector(element).insertAdjacentHTML("beforeend","<div class='layer-check'><input type='checkbox' id='native-pop'><label for='#native-pop'>Native Population in 2020</label></div>")
        //toggle for treaty layers
        document.querySelector("#treaties").addEventListener("input",function(e){
            showCessions = e.target.checked;
            if (e.target.checked){
                treatyLand.resetStyle()
                treatyLand.eachLayer(treatyFeature)
                labels.addTo(map);
                labels.rerenderTiles();
            }
            else{
                treatyLand.resetStyle()
                treatyLand.eachLayer(treatyFeature)
                labels.remove(map)
            }
        })
        //toggle for native population points
        document.querySelector("#native-pop").addEventListener("input",function(e){
            showNativePop = e.target.checked;
            if (e.target.checked){
                nativePop.addTo(map);
                document.querySelector(".legend").insertAdjacentHTML('beforeend',nativePopLegend)
            }
            else{
                nativePop.remove(map)
                document.querySelector(".native-pop-legend-container").remove();
            }
        })
    }


    document.addEventListener("DOMContentLoaded", createMap)
})();