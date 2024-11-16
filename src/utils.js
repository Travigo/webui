export default {
  getDatasources() {
    let datasources = []

    let args = Array.prototype.slice.call(arguments, 0)

    for (let argI = 0; argI < args.length; argI++) {
      const argE = args[argI]

      if (argE === undefined || argE === null) {
        continue
      }

      if(Array.isArray(argE)) {
        for (let arrI = 0; arrI < argE.length; arrI++) {
          const arrE = argE[arrI];
          datasources = datasources.concat(this.getDatasourcesFromObject(arrE))
        }
      } else {
        datasources = datasources.concat(this.getDatasourcesFromObject(argE))
      }
    }

    // make unique
    let uniqueDatasources = []
    let uniqueDatasourcesMap = {}
    datasources.forEach(element => {
      if(uniqueDatasourcesMap[element.ProviderID] !== true) {
        uniqueDatasources.push(element)
        uniqueDatasourcesMap[element.ProviderID] = true
      }
    })

    return uniqueDatasources
  },
  getDatasourcesFromObject(element) {
    let datasources = []

    if (element.DataSource !== null && element.DataSource !== undefined) {
      datasources.push(element.DataSource)
    }
    if (element.Datasource !== null && element.Datasource !== undefined) {
      datasources.push(element.Datasource)
    }
    if (element.datasource !== null && element.datasource !== undefined) {
      datasources.push(element.datasource)
    }

    return datasources
  }
}