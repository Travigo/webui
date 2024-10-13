import { DateTime } from "luxon";

export default {
  time(datetimeString, displayTimezone) {
    if (datetimeString == "0001-01-01T00:00:00Z") {
      return "--"
    }

    let stupidDatetimeMatch = datetimeString.match(/0000-01-01T(\d{2}:\d{2}):\d{2}Z/)
    if (stupidDatetimeMatch) {
      return stupidDatetimeMatch[1]
    }

    let datetime = DateTime.fromISO(datetimeString)

    let timezone = "UTC"
    if (displayTimezone !== undefined) {
      timezone = displayTimezone
    }

    return datetime.setZone(timezone).toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  },
  occupancyDescription(occupancy) {
    if (occupancy == -1) {
      return ''
    } else if (occupancy < 20) {
      return 'Empty'
    } else if (occupancy < 40) {
      return 'Space'
    } if (occupancy < 70) {
      return 'Busy'
    } if (occupancy < 90) {
      return 'Very Busy'
    } else {
      return 'Full'
    }
  },
  date(datetimeString) {
    let datetime = new Date(datetimeString)

    return `${this.padToTwo(datetime.getDate())}/${this.padToTwo(datetime.getMonth()+1)}/${datetime.getFullYear()}`
  },
  day(datetimeString) {
    let datetime = new Date(datetimeString)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    return days[datetime.getDay()]
  },
  padToTwo(number) {
    if (number<=99) { number = ("0"+number).slice(-2) }
    return number;
  },
  duration(nanoseconds) {
    let seconds = nanoseconds/1000000000
    let minutes = seconds/60

    let hours = Math.floor(minutes/60)
    let hourMinutesRemaining = minutes%60

    let duration = `${minutes}m`

    if (minutes >= 60) {
      if (hourMinutesRemaining == 0) {
        duration = `${hours}hr`
      } else {
        duration = `${hours}hr ${hourMinutesRemaining}m`
      }
    }

    return duration
  }
}
