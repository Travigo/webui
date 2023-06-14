export default {
  time(datetimeString) {
    if (datetimeString == "0001-01-01T00:00:00Z") {
      return "--"
    }

    let datetime = new Date(datetimeString)

    let hours = this.padToTwo(datetime.getHours())
    let minutes = this.padToTwo(datetime.getMinutes())

    return `${hours}:${minutes}`
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
