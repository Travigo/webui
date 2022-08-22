export default {
  parseIncorrectDateTime(datetimeString) {
    let datetime = new Date(datetimeString)
    let userTimezoneOffset = datetime.getTimezoneOffset() * 60000
    
    return new Date(datetime.getTime() + userTimezoneOffset)
  },
  time(datetimeString) {
    let datetime = this.parseIncorrectDateTime(datetimeString)

    let hours = this.padToTwo(datetime.getHours())
    let minutes = this.padToTwo(datetime.getMinutes())

    return `${hours}:${minutes}`
  },
  day(datetimeString) {
    let datetime = this.parseIncorrectDateTime(datetimeString)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    return days[datetime.getDay()]
  },
  padToTwo(number) {
    if (number<=99) { number = ("0"+number).slice(-2) }
    return number;
  }
}
