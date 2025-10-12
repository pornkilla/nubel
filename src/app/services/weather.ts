/* Gismeteo V2
* Get current weather
const requestUrl = new URL('https://api.gismeteo.net/v2/weather/forecast/by_day_part/');
const params = {
	latitude: '55.485290',
	longitude: '54.873472',
	lang: 'ru',
	days: '3',
};

* Get weather forecast
const requestUrl = new URL('https://api.gismeteo.net/v2/weather/forecast/aggregate/');
const params = {
	latitude: '55.485290',
	longitude: '54.873472',
	lang: 'ru',
	days: '10',
};

* Headers
const headers = {
	'X-Gismeteo-Token': process.env["WEATHER_API_KEY"],
	'Content-Type': 'text/plain',
	'Access-Control-Allow-Origin': '*',
};
*/

/* Gismeteo V3 
https://api.gismeteo.net/v3
*/