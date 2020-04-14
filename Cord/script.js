
// Set-Up

var margin = {left:90, top:90, right:90, bottom:90},
	width = Math.min(window.innerWidth, 1000) - margin.left - margin.right,
    height = Math.min(window.innerWidth, 1000) - margin.top - margin.bottom,
    innerRadius = Math.min(width, height) * .39,
    outerRadius = innerRadius * 1.1;

var Names = ["f&d", "h&a", "hardlines", "hbw", "health & beauty", "home", "hotel", "retail", "softlines", "tech & toys", "ttd", "ttd - leisure", "ttd - live"],
	colors = ["#fada5e", "#8e8c6d", "#74c493", "#447c69", "#7c9fb0", "#9163b6", "#562558", "#993767", "#e0598b", "#e279a3", "#f19670", "#e2975d", "#e2975d"],
  opacityDefault = 0.8;


var matrix = [
  [944311,91501,74018,216891,39176,58038,27443,231343,76471,61943,126078,245540,33572], //f&d
  [77884,465119,36616,119192,18517,28953,12202,84664,34464,31013,44630,105979,15083], //h&a
  [26316,17069,358293,41942,31314,77212,6118,64214,91237,68381,16409,38624,6638], //hardlines
  [166374,110950,87280,1610501,62119,71209,32282,211542,90537,61256,123704,278290,40503], //hbw
  [27179,17444,69658,57602,252081,51556,6807,55458,73207,46478,25693,37614,5959], //health & beauty
  [24272,15647,80323,41120,40511,326722,6208,58452,89225,73381,17207,34413,5951], //home
  [20520,10760,11231,29895,5764,9563,154421,27341,12296,9966,21026,45932,7176], //hotel
  [130214,64819,96430,178134,49683,77599,25326,920829,111114,81322,82357,194018,27576], //retail
  [30356,17442,88136,48751,55173,82072,7862,77390,666614,72867,25226,42103,7282], //softlines
  [26418,18389,74476,38843,38098,75000,7013,61398,82529,357349,22462,42523,6767], //tech & toys
  [193635,85821,57234,242174,49766,52798,38448,199752,72936,59578,860289,377518,55967], //ttd
  [108746,56630,66608,161441,13734,42756,28166,151162,56886,50075,0,1201873,55078], //ttd - leisure
  [12620,7207,10133,21217,1970,6363,4011,19026,9012,6997,0,48107,93146], //ttd - live

];


////////////////////////////////////////////////////////////
/////////// Create scale and layout functions //////////////
////////////////////////////////////////////////////////////

var colors = d3.scale.ordinal()
    .domain(d3.range(Names.length))
	.range(colors);

//A "custom" d3 chord function that automatically sorts the order of the chords in such a manner to reduce overlap
var chord = customChordLayout()
    .padding(.05)
    .sortChords(d3.descending) //which chord should be shown on top when chords cross. Now the biggest chord is at the bottom
	.matrix(matrix);

var arc = d3.svg.arc()
    .innerRadius(innerRadius*1.01)
    .outerRadius(outerRadius);

var path = d3.svg.chord()
	.radius(innerRadius);

////////////////////////////////////////////////////////////
////////////////////// Create SVG //////////////////////////
////////////////////////////////////////////////////////////

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
	.append("g")
    .attr("transform", "translate(" + (width/2 + margin.left) + "," + (height/2 + margin.top) + ")");

////////////////////////////////////////////////////////////
/////////////// Create the gradient fills //////////////////
////////////////////////////////////////////////////////////

//Function to create the id for each chord gradient
function getGradID(d){ return "linkGrad-" + d.source.index + "-" + d.target.index; }

//Create the gradients definitions for each chord
var grads = svg.append("defs").selectAll("linearGradient")
	.data(chord.chords())
   .enter().append("linearGradient")
	.attr("id", getGradID)
	.attr("gradientUnits", "userSpaceOnUse")
	.attr("x1", function(d,i) { return innerRadius * Math.cos((d.source.endAngle-d.source.startAngle)/2 + d.source.startAngle - Math.PI/2); })
	.attr("y1", function(d,i) { return innerRadius * Math.sin((d.source.endAngle-d.source.startAngle)/2 + d.source.startAngle - Math.PI/2); })
	.attr("x2", function(d,i) { return innerRadius * Math.cos((d.target.endAngle-d.target.startAngle)/2 + d.target.startAngle - Math.PI/2); })
	.attr("y2", function(d,i) { return innerRadius * Math.sin((d.target.endAngle-d.target.startAngle)/2 + d.target.startAngle - Math.PI/2); })

//Set the starting color (at 0%)
grads.append("stop")
	.attr("offset", "0%")
	.attr("stop-color", function(d){ return colors(d.source.index); });

//Set the ending color (at 100%)
grads.append("stop")
	.attr("offset", "100%")
	.attr("stop-color", function(d){ return colors(d.target.index); });

////////////////////////////////////////////////////////////
////////////////// Draw outer Arcs /////////////////////////
////////////////////////////////////////////////////////////

var outerArcs = svg.selectAll("g.group")
	.data(chord.groups)
	.enter().append("g")
	.attr("class", "group")
	.on("mouseover", fade(.1))
	.on("mouseout", fade(opacityDefault));

outerArcs.append("path")
	.style("fill", function(d) { return colors(d.index); })
	.attr("d", arc)
	.each(function(d,i) {
		//Search pattern for everything between the start and the first capital L
		var firstArcSection = /(^.+?)L/;

		//Grab everything up to the first Line statement
		var newArc = firstArcSection.exec( d3.select(this).attr("d") )[1];
		//Replace all the comma's so that IE can handle it
		newArc = newArc.replace(/,/g , " ");

		//If the end angle lies beyond a quarter of a circle (90 degrees or pi/2)
		//flip the end and start position
		if (d.endAngle > 90*Math.PI/180 & d.startAngle < 270*Math.PI/180) {
			var startLoc 	= /M(.*?)A/,		//Everything between the first capital M and first capital A
				middleLoc 	= /A(.*?)0 0 1/,	//Everything between the first capital A and 0 0 1
				endLoc 		= /0 0 1 (.*?)$/;	//Everything between the first 0 0 1 and the end of the string (denoted by $)
			//Flip the direction of the arc by switching the start en end point (and sweep flag)
			//of those elements that are below the horizontal line
			var newStart = endLoc.exec( newArc )[1];
			var newEnd = startLoc.exec( newArc )[1];
			var middleSec = middleLoc.exec( newArc )[1];

			//Build up the new arc notation, set the sweep-flag to 0
			newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
		}//if

		//Create a new invisible arc that the text can flow along
		svg.append("path")
			.attr("class", "hiddenArcs")
			.attr("id", "arc"+i)
			.attr("d", newArc)
			.style("fill", "none");
	});

////////////////////////////////////////////////////////////
////////////////// Append Names ////////////////////////////
////////////////////////////////////////////////////////////

//Append the label names on the outside
outerArcs.append("text")
	.attr("class", "titles")
	.attr("dy", function(d,i) { return (d.endAngle > 90*Math.PI/180 & d.startAngle < 270*Math.PI/180 ? 25 : -16); })
   .append("textPath")
	.attr("startOffset","50%")
	.style("text-anchor","middle")
	.attr("xlink:href",function(d,i){return "#arc"+i;})
	.text(function(d,i){ return Names[i]; });

////////////////////////////////////////////////////////////
////////////////// Draw inner chords ///////////////////////
////////////////////////////////////////////////////////////

svg.selectAll("path.chord")
	.data(chord.chords)
	.enter().append("path")
	.attr("class", "chord")
	.style("fill", function(d){ return "url(#" + getGradID(d) + ")"; })
	.style("opacity", opacityDefault)
	.attr("d", path)
	.on("mouseover", mouseoverChord)
	.on("mouseout", mouseoutChord);

////////////////////////////////////////////////////////////
////////////////// Extra Functions /////////////////////////
////////////////////////////////////////////////////////////

//Returns an event handler for fading a given chord group.
function fade(opacity) {
  return function(d,i) {
    svg.selectAll("path.chord")
        .filter(function(d) { return d.source.index !== i && d.target.index !== i; })
		.transition()
        .style("opacity", opacity);
  };
}//fade

//Highlight hovered over chord
function mouseoverChord(d,i) {

	//Decrease opacity to all
	svg.selectAll("path.chord")
		.transition()
		.style("opacity", 0.1);
	//Show hovered over chord with full opacity
	d3.select(this)
		.transition()
        .style("opacity", 1);

	//Define and show the tooltip over the mouse location
	$(this).popover({
		placement: 'auto top',
		container: 'body',
		mouseOffset: 10,
		followMouse: true,
		trigger: 'hover',
		html : true,
		content: function() {
      var retval = "<p style='font-size: 11px; text-align: center;'>";
      if (Names[d.source.index] == Names[d.target.index]) {
        retval = retval +
        " If you purchased <span style='font-weight:900'>" + Names[d.source.index] + "</span>" +
        " your next purchase was also <span style='font-weight:900'>" + Names[d.target.index] + "</span>" +
        " this occurred <span style='font-weight:900'>" + numberWithCommas(d.source.value) + "</span> times " +
        "</p>";
      } else {
        retval = retval +
        " If you purchased <span style='font-weight:900'>" + Names[d.source.index] + "</span>" +
        " your next purchase was <span style='font-weight:900'>" + Names[d.target.index] + "</span>" +
        " this occurred <span style='font-weight:900'>" + numberWithCommas(d.source.value) + "</span> times " +
        " </p><p style='font-size: 11px; text-align: center;'>Also if you purchased <span style='font-weight:900'>" + Names[d.target.index] + "</span>" +
        " your next purchase was <span style='font-weight:900'>" + Names[d.source.index] + "</span>" +
        " this occurred <span style='font-weight:900'>" + numberWithCommas(d.target.value) + "</span> times " +
        "</p>";
      }//if
			return retval;
              console.log(d.source.value);}
	});
	$(this).popover('show');
}//mouseoverChord

//Bring all chords back to default opacity
function mouseoutChord(d) {
	//Hide the tooltip
	$('.popover').each(function() {
		$(this).remove();
	});
	//Set opacity back to default for all
	svg.selectAll("path.chord")
		.transition()
		.style("opacity", opacityDefault);
}//function mouseoutChord


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
