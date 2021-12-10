window.addEventListener('resize', () => {
	setDims();
	update();
});

let chartData,
	countryByIndicatorObj,
	indicatorByCountryObj,
	hierarchyObj,
	hierarchy,
	// hierarchyArrs = HIERARCHY_ARRS,
	// colors = COLORS,
	idsMap,
	selectedYear = 2007,
	selectedIndicator = 'ACTIVOS CORRIENTES',
	selectedCountries = {},
	currCountries,
	allIndicators,
	interval,
	time = 2000,
	g,
	svg,
	stratify,
	hideThreshold = 0.001,
	treemap;

$('#year-slider').slider({
	range: false,
	max: 2020,
	min: 2000,
	step: 1,
	slide: (e, ui) => {
		selectedYear = ui.value;
		wrangleData();
		update();
	},
	value: selectedYear,
});
$('button#play').on('click', play);
$('button#pause').on('click', pause);
$('button#reset').on('click', reset);
$('select#indicator').on('change', changeIndicator);

function legendClick(d, i) {
	// console.log({ d, i });
	selectedCountries[d] = !selectedCountries[d];
	// console.log({ selectedCountries });
	$(`.${d.split(' ').join('-')}.legend-container`).toggleClass('inactive');

	wrangleData();
	update();
}
function play() {
	function step() {
		if (selectedYear !== 2020) {
			selectedYear += 1;
		} else {
			selectedYear = 2000;
		}

		$('button#pause').show();
		$('button#play').hide();
		$('#year-slider').value = selectedYear;

		wrangleData();
		update();
	}
	step();
	interval = setInterval(step, time);
}
function pause() {
	$('button#pause').hide();
	$('button#play').show();
	clearInterval(interval);
}
function reset() {
	selectedYear = 2000;
	$('#year-slider').value = selectedYear;

	wrangleData();
	update();
}
function changeIndicator(e) {
	selectedIndicator = e.target.value;
	wrangleData();
	update();
}

function setDims() {
	margins = { top: 110, left: window.innerWidth / 20 };
	width = window.innerWidth - margins.left * 2;
	height = window.innerHeight - margins.top * 2;

	// console.log({ height, width, left: margins.left, top: margins.top });
}
function formatNum(x) {
	if (x === 0) return 0;
	if (x < 10) return Number(x);
	const s = d3.format('.2s')(x);
	switch (s[s.length - 1]) {
		case 'G':
			return s.slice(0, -1) + 'B'; // billions
		case 'k':
			return s.slice(0, -1) + 'K'; // thousands
	}
	return s;
}

function getAllIndicatorsData() {
	const res = {};
	const data = indicatorByCountryObj[selectedYear];

	Object.entries(data).forEach(([cK, cObj]) => {
		res[cK] = [];
		Object.entries(cObj).forEach(([indK, indArr]) => {
			// console.log(indArr);
			res[cK] = [...res[cK], ...indArr];
		});
	});

	return res;
}
function reduceCountriesValues(countriesEntries) {
	const reducedCountriesValues = {};
	Object.keys(countriesEntries).forEach(k => {
		reducedCountriesValues[k] = countriesEntries[k].reduce(
			(acc, o) => (acc += o.value),
			0
		);
	});
	return reducedCountriesValues;
}

function wrangleData() {
	const indicatorsByYear = countryByIndicatorObj[selectedYear];

	const countriesEntries =
		selectedIndicator !== 'Todos'
			? indicatorsByYear[selectedIndicator] || {}
			: getAllIndicatorsData() || {};

	chartData = Object.entries(selectedCountries)
		.map(([k, v]) => (v === true ? countriesEntries[k] : null))
		.filter(Boolean)
		.flat();

	currCountries = Object.keys(countriesEntries);
	companieValuesSum = d3.sum(chartData, d => d.value);
	reducedCountriesValues = reduceCountriesValues(countriesEntries);
	companieValuesSum = chartData.reduce((acc, o) => (acc += o.value), 0);

	hierarchyObj = {
		root: [{ id: 'Root', parent: '', value: companieValuesSum }],
		parents: Object.entries(reducedCountriesValues).map(([k, v]) => ({
			id: k,
			value: v,
			parent: 'Root',
		})),
		companies: chartData.map(item => ({
			id: item.company,
			value: item.value,
			parent: item.country,
			key: item.id,
		})),
	};

	// hierarchy = [...Object.entries(hierarchyObj).map(([k, v]) => v)].flat();
	hierarchy = hierarchyObj.root
		.concat(hierarchyObj.parents)
		.concat(hierarchyObj.companies);

	idsMap = d3
		.nest()
		.key(d => d.id)
		.rollup(d => d[0])
		.object(chartData);

	// console.log(idsMap);
}
// prettier-ignore
(async function init() {
	setDims();

	const rawData = await d3.dsv(';', '../data/electrorating_indicadores_financieros_v2.csv');
// TIME_Year;
// FACT_INDICATOR_FINANCE_Key;
// UTILITY_Country;
// INDICATOR_Name;
// FACT_INDICATOR_FINANCE_Name_In_Document;
// CURRENCY_Name;
// INDICATOR_Theme;
// UTILITY_Name;
// FACT_INDICATOR_FINANCE_Holding_Company;
// FACT_INDICATOR_Value;
// FACT_INDICATOR_FINANCE_Order_Magnitude;
// FACT_INDICATOR_FINANCE_Document;
// FACT_INDICATOR_FINANCE_Link;
// TIME_Key;
// FACT_INDICATOR_FINANCE_ADJUSTED_Value;
// FACT_INDICATOR_Value_Local

console.log(rawData)
	const formatedData = rawData
		.map(item => ({
			id: Number(item['FACT_INDICATOR_FINANCE_Key']),
			year: Number(item['TIME_Year']),
			indicator: item['INDICATOR_Name'],
			country: item['UTILITY_Country'],
			company: item['UTILITY_Name'],
			value: Number(item['FACT_INDICATOR_FINANCE_ADJUSTED_Value']),
			valueLocal: Number(item['FACT_INDICATOR_Value']),
			valueMag: Number(item['FACT_INDICATOR_FINANCE_Order_Magnitude']),
			doc: item['FACT_INDICATOR_FINANCE_Document'],
			// theme: item['INDICATOR_Theme'],
		}))
		.filter(item => item.value !== 0);

	countryByIndicatorObj = d3.nest()
		.key(d => d.year)
		.key(d => d.indicator)
		.key(d => d.country)
		.object(formatedData);

	indicatorByCountryObj = d3.nest()		
		.key(d => d.year)
		.key(d => d.country)
		.key(d => d.indicator)
		.object(formatedData);

	allCountries = Array.from(new Set(rawData.map(item => item['UTILITY_Country']))).sort();
	allIndicators = Array.from(new Set(rawData.map(item => item['INDICATOR_Name']))).sort()
	allCompanies = Array.from(new Set(rawData.map(item => item['UTILITY_Name'])));

	allCountries.forEach(c => selectedCountries[c] = true);

	svg = d3.select('svg');

	g = svg.append('g');

	// append-select-options
	['Todos'].concat(Array.from(allIndicators)).forEach(indicator => {
		d3.select('select#indicator')
			.append('option')
			.attr('value', indicator)
			.text(indicator);
	});
	// append-buttons
	d3.select('#countries-legends')
		.selectAll('div')
		.data(allCountries)
		.enter()
		.append('div')
		.attr('class', d => `${d.split(' ').join('-')} legend-container`)
		.attr('title', d => d)
		.text(d => d.split(' ').map(w => w[0] + w.slice(1).toLowerCase()).join(' '))
		.on('click', legendClick)
		.append('div')
		.attr('class', 'legend-btn')
		.style('background', (d, i) => `var(--${d.split(' ').join('-')})`);

	$('select#indicator').children().each(function() {
		if ($(this).val() === selectedIndicator) {
			$(this).attr('selected', true)
		}
	})

	stratify = d3
		.stratify()
		.id(d => d.id)
		.parentId(d => d.parent);

	treemap = (width, height) =>
		d3.treemap().size([width, height]).paddingOuter(1).paddingInner(1);

	console.log({
	// 	rawData,
	// 	allCountries,
		// selectedCountries,
	// 	allIndicators,
	// 	allCompanies,
	// 	formatedData,
	// 	countryByIndicatorObj,
		// indicatorByCountryObj,
	});

	wrangleData();
	update();
})();

function update() {
	svg.attr('width', width).attr('height', height);
	g.attr('width', width).attr('height', height);

	let root = stratify(hierarchy)
		.sum(d => {
			// console.log(d);
			let isLeaf = d.parent && d.parent !== 'Root';
			return isLeaf ? d.value : 0;
		})
		.sort((a, b) => b.value - a.value);
	treemap(width, height)(root);

	// ----------------- TEXT ----------------- ///

	d3.select('#chart-area')
		.selectAll('.text-div')
		// .data([...root.leaves()])
		.data(root.leaves())
		.join('div')
		.attr('class', 'text-div')
		.style('width', d => d.x1 - d.x0 + 'px')
		.style('height', d => d.y1 - d.y0 + 'px')
		.style('display', 'none')
		.transition()
		.duration(400)
		.style('display', d => {
			if (d.value > companieValuesSum * hideThreshold) return 'block';
			return 'none';
		})
		.attr('title', d => d.id)
		.style('left', d => d.x0 + 'px')
		.style('top', d => d.y0 + 'px')
		.style('width', d => d.x1 - d.x0 + 'px')
		.style('height', d => d.y1 - d.y0 + 'px')
		.text(d => {
			if (!d.value) return '';

			const txts = {
				0: '',
				1: '',
				2: `${d.id.split(' ')[0]} ${
					d.id.split(' ')[1] || ''
				} ${formatNum(d.value)}`,
			};
			return txts[d.depth];
		});

	// ----------------- RECTS --------------------------- //

	d3.select('g')
		.selectAll('.node')
		.data(root.leaves())
		.join('rect')
		.attr('class', 'node')
		.attr('width', d => d.x1 - d.x0 + 'px')
		.attr('height', d => d.y1 - d.y0 + 'px')
		.transition()
		.duration(400)
		.attr('title', d => d.id)
		.style('x', d => d.x0 + 'px')
		.style('y', d => d.y0 + 'px')
		.attr('width', d => d.x1 - d.x0 + 'px')
		.attr('height', d => d.y1 - d.y0 + 'px')
		.attr('opacity', d => 0.7)
		.attr('fill', d => {
			if (!d.parent || d.parent.id === 'Root') return 'none';
			return `var(--${d.parent.id.split(' ').join('-')})`;
		});

	// ------------------ TOOLTIP ------------------ //

	d3.select('g').selectAll('.node').on('mousemove', showTooltip);
	d3.select('g').selectAll('.node').on('mouseout', hideTooltip);

	// -------------------- DOM CHANGES ---------------------- //

	$('h1#year-display').text(selectedYear);
	$('#year-slider').slider('value', selectedYear);
	$('.legend-container').each(function (i) {
		if (currCountries.includes(this.title)) {
			$(this).css({ display: 'flex' });
		} else {
			$(this).css({ display: 'none' });
		}
	});
	$('#companies-info').text(
		`${indicator === 'Todos' ? 'Ocurrencias: ' : 'Companias: '} ${formatNum(
			chartData.length
		)}`
	);
	$('#countries-info').text(
		`Países: ${
			currCountries.filter(country => selectedCountries[country]).length
		}`
	);
	// console.log({ currCountries, selectedCountries });
	$('#total-info').text(`Valor Acumulado: ${formatNum(companieValuesSum)}`);
}

function showTooltip(d, i, e) {
	const { offsetX: x, offsetY: y } = d3.event;
	const isLeft = x < width / 2;
	// prettier-ignore
	const { width: tipWidth, height: tipHeight } = document.querySelector('#tooltip').getBoundingClientRect();

	$('#tooltip').css({
		opacity: 0.86,
		top: y + tipHeight * 1.5,
		left: isLeft ? x + tipWidth * 0.25 : 'unset',
		right: isLeft ? 'unset' : width - x + tipWidth * 0.25,
	});

	$('.row.country').html(
		`<div style="width: 12px; height:12px; border-radius: 6px; margin-right: .25rem; 
			background: var(--${idsMap[d.data.key].country.split(' ').join('-')});"></div> 
			${idsMap[d.data.key].company} - ${idsMap[d.data.key].country}`
	);
	// prettier-ignore
	$('.row.indicator').text(`${idsMap[d.data.key].indicator}: ${formatNum(idsMap[d.data.key].value)}`)
}

function hideTooltip(d, i, e) {
	$('#tooltip').css({ opacity: 0, pointerEvents: 'none' });
}
