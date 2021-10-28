// The svg
var svg = d3.select("svg"),
    width = +window.innerWidth,
    height = +window.innerHeight;

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Map and projection
var path = d3.geoPath();
var projection = d3.geoMercator()
    .scale(260)
    .center([0, 0])
    .translate([width / 2, height / 2 + 100]);

// Data and color scale
var data = d3.map();

let thresholdScale = d3.scaleThreshold()
    .domain([0, 15, 25, 35, 55])
    .range(["#eeece1", "#eeece1", "#aae7f1", "#b18170", "#af5434", "#7c2405"]);

var legendText = ["Good situation", "Satisfactory situation", "Problematic situation", "Difficult situation", "Very serious situation"];
var legendColors = ["#eeece1", "#aae7f1", "#b18170", "#af5434", "#7c2405"];


// Load external data and boot
d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    .defer(d3.csv, "data/index_2021_2020_bereinigt.csv")
    .await(ready);

function ready(error, topo, data) {
    var countries = topo.features;
    data.forEach(function(d) {
        let years = new Array();
        years[0] = +d.sc_2020;
        years[1] = +d.sc_2021;
        d.years = years;

    });

    function getDataFromCountry(country, code) {
        data.forEach(function(d) {

            if (d.code == code) {

                country.properties.year2020 = d.years[0];
                country.properties.year2021 = d.years[1];
                country.properties.Rank2021 = d.Rank2021;
                country.properties.Rank2020 = d.Rank2020;
                country.properties.EN_country = d.EN_country;
                country.properties.changeRank = d.changeRank;
                return false;
            }

        });
    }


    countries.forEach(function(country) {
        country.properties.years = getDataFromCountry(country, country.id)
            //console.log(country.properties)
    });

    let path = d3.geoPath().projection(projection);

    var countriesShapes = svg.selectAll(".county")
        .data(topo.features)
        .enter()
        .append("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("fill", "#FFFFFF")
        .attr("stroke", "#FFFFFF")
        .attr("strokeWidth", "1px")
        .attr("strokeOpacity", 0.5);

    countriesShapes.on("mouseover", function(d) {
            tooltip.transition()
                .duration(250)
                .style("opacity", 1);
            tooltip.html(
                    "<p><strong>" + d.properties.EN_country + ", <br/>Rank out of 180 countries:</strong></p>" +
                    "<table><tbody><tr><td class='wide'>2020:</td><td>" + d.properties.Rank2020 + "</td></tr>" +
                    "<tr><td>2021:</td><td>" + d.properties.Rank2021 + "</td></tr>" +
                    "<tr><td>Change Rank:</td><td>" + d.properties.changeRank + "</td></tr></tbody></table>"
                )
                .style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(250)
                .style("opacity", 0);
        });

    function update(year) {

        countriesShapes.transition().duration(500).style("fill", function(d) {
            let total = 0;
            if (year == 2020) {
                total = d.properties.year2020 || 0;
            } else {
                total = d.properties.year2021 || 0;
            }
            if (total == 0) {
                return "#FFFFFF"
            } else {

                return thresholdScale(total)
            }

        });
    }


    update(2020);



    d3.selectAll("input").on("change", function() {
        let year = this.value;
        update(year);
    });


    var legend = svg.append("g")
        .attr("id", "legend");

    var legenditem = legend.selectAll(".legenditem")
        .data(d3.range(5))
        .enter()
        .append("g")
        .attr("class", "legenditem")
        .attr("transform", function(d, i) {
            return "translate(0," + i * 30 + ")";
        });

    legenditem.append("rect")
        .attr("x", 24)
        .attr("y", 180)
        .attr("width", 6)
        .attr("height", 30)
        .attr("class", "rect")
        .style("fill", function(d, i) {
            return legendColors[i];
        });

    legenditem.append("text")
        .attr("x", 40)
        .attr("y", 200)
        .style("text-anchor", "left")
        .text(function(d, i) {
            return legendText[i];
        });

}