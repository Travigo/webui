<template>
  <section
    v-if="datasources.length > 0"
    class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4"
  >
    <div class="flex items-start gap-3">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
        <span class="material-symbols-outlined text-[21px]">database</span>
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Data provided by</h2>
        <div class="mt-2 flex flex-wrap gap-2">
          <router-link
            v-for="datasource in uniqueDatasources"
            v-bind:key="datasource.key"
            :to="{'name': 'datasources/provider', params: {'id': datasource.ProviderID}}"
            class="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-200 dark:hover:bg-blue-500/10"
          >
            {{ datasource.ProviderName }}
            <span class="material-symbols-outlined text-[15px]">chevron_right</span>
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'DatasourceAttributes',
  props: {
    datasources: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    uniqueDatasources() {
      const seen = new Set()

      return this.datasources
        .filter(datasource => datasource?.ProviderID && datasource?.ProviderName)
        .filter(datasource => {
          const key = datasource.ProviderID

          if (seen.has(key)) {
            return false
          }

          seen.add(key)
          return true
        })
        .map(datasource => ({
          ...datasource,
          key: `${datasource.ProviderID}-${datasource.DatasetID || datasource.ProviderName}`
        }))
    }
  }
}
</script>
