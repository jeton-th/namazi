import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import SunCalc from 'suncalc';

const getTimeDiv = (label, time) => (
  <div key={label} className="time">
    <span>{label}</span>
    <span>{`${String(time.getHours()).padStart(2, 0)}:${String(time.getMinutes()).padStart(2, 0)}`}</span>
  </div>
);

const App = () => {
  const [date, setDate] = useState(new Date());
  const [coords, setCoords] = useState();
  const [times, setTimes] = useState([]);
  const [place, setPlace] = useState('');
  const [dateInput, setDateInput] = useState(false);
  const [placeInput, setPlaceInput] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setCoords({
        latitude: position.coords.latitude.toFixed(1),
        longitude: position.coords.longitude.toFixed(1),
      });
    });
  }, []);

  useEffect(() => {
    if (!date || !coords) return;
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const { latitude, longitude } = coords;
    const selectedDateTimes = SunCalc.getTimes(date, latitude, longitude);
    const nextDayTimes = SunCalc.getTimes(nextDay, latitude, longitude);
    const {
      nauticalDawn,
      sunrise,
      solarNoon,
      sunset,
      nauticalDusk,
    } = selectedDateTimes;
    const halfAfterNoon = (sunset - solarNoon) / 2;
    const asr = new Date(solarNoon.getTime() + halfAfterNoon);
    const nextDayDawn = nextDayTimes.nauticalDawn;
    const halfNight = (nextDayDawn - sunset) / 2;
    const midnight = new Date(sunset.getTime() + halfNight);

    setTimes([
      ['Fajr', nauticalDawn],
      ['Sunrise', sunrise],
      ['Dhuhr', solarNoon],
      ['Asr', asr],
      ['Maghrib', sunset],
      ['Isha', nauticalDusk],
      ['Midnight', midnight],
    ]);
  }, [date, coords]);

  const searchLocation = (e) => {
    if (e.key === 'Escape') {
      setPlace('');
      setPlaceInput(false);
    } else if (e.key === 'Enter') {
      if (place.length < 3) return;

      const key = process.env.NODE_ENV === 'development'
        ? process.env.REACT_APP_LOCATION_IQ_KEY
        : process.env.LOCATION_IQ_KEY;

      fetch(`https://eu1.locationiq.com/v1/search.php?key=${key}&q=${place}&format=json`)
        .then((res) => res.json())
        .then((res) => {
          if (!res.error && res.length > 0) {
            const { lon, lat } = res[0];
            setCoords({
              latitude: parseFloat(lat).toFixed(1),
              longitude: parseFloat(lon).toFixed(1),
            });
          }
        });
    }
  };

  return (
    <div className="content">
      <header>
        <button
          type="button"
          onClick={() => setDateInput((prev) => {
            if (!prev) setPlaceInput(false);
            return !prev;
          })}
        >
          <FontAwesomeIcon icon={faCalendarAlt} />
        </button>

        <h1>{date.toDateString()}</h1>

        <button
          disabled
          type="button"
          onClick={() => setPlaceInput((prev) => {
            if (!prev) setDateInput(false);
            return !prev;
          })}
        >
          <FontAwesomeIcon icon={faMapMarkerAlt} />
        </button>
      </header>

      {dateInput && (
        <input
          type="date"
          value={date.toISOString().slice(0, 10)}
          onChange={(e) => setDate(new Date(e.target.value))}
        />
      )}

      {placeInput && (
        <input
          type="search"
          value={place}
          placeholder="Set your place"
          onChange={(e) => setPlace(e.target.value)}
          onKeyDown={searchLocation}
        />
      )}

      <div className="times">
        {times.map(([label, time]) => getTimeDiv(label, time))}
      </div>
    </div>
  );
};

export default App;
