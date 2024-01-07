
var map = L.map('map').setView([48.856,2.352], 13) //initializing the map component. fly view to Paris

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);//adding the map tile layer to the map container.

var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function createTodayWeatherCard(weatherData,country){
let {weather,temp2m} = weatherData;

var weatherCard = document.createElement('div');
weatherCard.id = 'weathercard';
weatherCard.style.display = 'none';

var innerDiv = document.createElement('div');
innerDiv.className = 'weathercard';

var countryName = document.createElement('h4');
countryName.id='country-label'
countryName.textContent=country;

var weatherImage = document.createElement('img');
weatherImage.id = 'weather-image';
weatherImage.src = 'images/'+weather+'.png'; // You can set the src attribute here if you have a default image

var weatherLabel = document.createElement('p');
weatherLabel.id = 'weather-label';
weatherLabel.textContent=weather;

var maxTemp = document.createElement('p');
maxTemp.id = 'max-temp';
maxTemp.textContent = 'High: '+temp2m.max+'\u00B0C'

var minTemp = document.createElement('p');
minTemp.id = 'min-temp';
minTemp.textContent = 'Low: '+temp2m.min+'\u00B0C'

innerDiv.appendChild(countryName);
innerDiv.appendChild(weatherImage);
innerDiv.appendChild(weatherLabel);
innerDiv.appendChild(maxTemp);
innerDiv.appendChild(minTemp);

weatherCard.appendChild(innerDiv);
return weatherCard;
}

function processDate(date){
    let dateString = date.toString();
    return dateString.slice(0,4)+'-'+dateString.slice(4,6)+'-'+dateString.slice(6)
}

function createWeekCard(index,weatherData){
    let {weather,temp2m,date}=weatherData
    let weekdayText = document.createElement('h5');
    let dateObject = new Date(processDate(date))
    weekdayText.textContent = days[dateObject.getDay()]
    let dateText = document.createElement('h4')
    dateText.textContent = dateObject.toLocaleDateString();
    let weather_icon = document.createElement('img');
    weather_icon.id='forecast-img-'+index;
    weather_icon.src='images/'+weather+'.png';
    let dayWeatherForecast = document.createElement('p')
    dayWeatherForecast.textContent = weather;
    let minmaxTemperature = document.createElement('span')
    minmaxTemperature.textContent = temp2m.max+'\u00B0 / '+temp2m.min+'\u00B0'

    let weekcard = document.createElement('div');
    weekcard.id='day-'+index;
    weekcard.className='p-2 text-center weekcardbg'
    weekcard.appendChild(dateText)
    weekcard.appendChild(weekdayText);
    weekcard.appendChild(weather_icon);
    weekcard.appendChild(dayWeatherForecast);
    weekcard.appendChild(minmaxTemperature);

    return weekcard;
}
//Adds a map marker containing custom marker icon
function displayMarker(coordinates,weatherData,city){
    console.log(weatherData)
    let weatherCard = createTodayWeatherCard(weatherData,city);
    L.marker(coordinates).addTo(map)
    .bindPopup(weatherCard.innerHTML)
    .openPopup();
}

function displayAllWeek(dataseries){
    let weekForecastContainer = document.getElementById('allweekforecast');
    while(weekForecastContainer.firstChild)
        weekForecastContainer.removeChild(weekForecastContainer.firstChild);
    for(let idx=0;idx<dataseries.length;idx++){
        let card = createWeekCard(idx,dataseries[idx]);
        weekForecastContainer.appendChild(card)
    }
}
// get the list of cities and populate selection drop-down
fetch('../city_coordinates.json')
.then(res=> res.json())
.then(data=>{
    //get paris
    let parisDataPoint = data.find(record=> record.city=='Paris');
    let selectDropDown = document.getElementById('floatingSelect');
    for(let location of data){
        let loc_option = document.createElement('option');
        loc_option.value=location.city+','+location.latitude+","+location.longitude;
        loc_option.innerText=location.city;
        selectDropDown.appendChild(loc_option);
    }
    callWeatherAPI([parisDataPoint.latitude,parisDataPoint.longitude])
    .then(res=> res.json())
    .then(data=> {
        let [today,...rest] = data.dataseries;
        displayMarker([parisDataPoint.latitude,parisDataPoint.longitude],today,parisDataPoint.city)
        displayAllWeek(rest)
    })
    
})

async function callWeatherAPI(coordinates){
    let [lat,long] = coordinates;
    var weatherData = await fetch(`http://www.7timer.info/bin/api.pl?lon=${long}&lat=${lat}&product=civillight&output=json`)
    return weatherData;
}

//Called on the event of user selecting a new city from the list
function selectCity() {
    // Extract latitude and longitude
    let selectedCoordinate = this.value.split(',');
    let [city,lat, long] = selectedCoordinate;
    console.log(city,lat,long)
    callWeatherAPI([Number(lat),Number(long)])
    .then(res=> res.json())
    .then(wdata=> {
        let {dataseries} = wdata;
        let [today, ...rest] = dataseries;
        displayMarker([Number(lat),Number(long)],today,city);
        displayAllWeek(rest)
    })
    // Set map view to the selected coordinates
    map.flyTo(new L.LatLng(lat, long), 10);
    
}
