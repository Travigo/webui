<template>
  <LoadingState
    v-if="loading"
    title="Loading operator group"
    subtitle="Fetching operators in this group."
    :show-tabs="false"
  />

  <div v-else-if="group" class="ui-page ui-page-stack">
    <PageHeader
      :title="group.Name"
      :subtitle="`${group.Operators?.length || 0} operator${group.Operators?.length === 1 ? '' : 's'}`"
      icon="groups"
      variant="panel"
    />

    <Panel title="Operators" padded>
      <Notice v-if="!group.Operators || group.Operators.length === 0" type="neutral" icon="">
        No operators are listed for this group.
      </Notice>

      <div v-else class="grid gap-2 md:grid-cols-2">
        <router-link
          v-for="operator in group.Operators"
          v-bind:key="operator.PrimaryIdentifier"
          :to="{'name': 'operators/view', params: {'id': operator.PrimaryIdentifier}}"
          class="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm transition hover:bg-brand-blue/10 dark:bg-slate-950/70 dark:hover:bg-brand-blue/100/10"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-blue shadow-sm dark:bg-slate-900 dark:text-brand-blue-light">
            <span class="material-symbols-outlined text-[20px]">business</span>
          </span>
          <span class="min-w-0 flex-1 truncate font-bold text-slate-700 dark:text-slate-200">
            {{ operator.PrimaryName }}
          </span>
          <span class="material-symbols-outlined shrink-0 text-[19px] text-slate-400">chevron_right</span>
        </router-link>
      </div>
    </Panel>
  </div>

  <div v-else class="ui-page ui-page-stack">
    <ErrorState
      :title="groupNotFound ? 'Operator group not found' : 'Operator group unavailable'"
      :message="groupNotFound ? 'This operator group does not exist, or is no longer available.' : 'Operator group details could not be loaded.'"
      retry
      :action-to="{ name: 'operators/home' }"
      action-label="Browse operators"
      @retry="getOperatorGroup"
    />
  </div>
</template>

<script>
import ErrorState from '@/components/ErrorState.vue'
import LoadingState from '@/components/LoadingState.vue'
import Notice from '@/components/Notice.vue'
import PageHeader from '@/components/PageHeader.vue'
import Panel from '@/components/Panel.vue'
import axios from 'axios'
import API from '@/API'

export default {
  data () {
    return {
      group: undefined,
      loading: true,
      error: undefined,
      groupNotFound: false,
    }
  },
  components: {
    ErrorState,
    LoadingState,
    Notice,
    PageHeader,
    Panel
  },
  methods: {
    getOperatorGroup() {
      this.loading = true
      this.error = undefined
      this.groupNotFound = false
      axios
      .get(`${API.URL}/core/operator_groups/${this.$route.params.id}`, { params: { view: 'web' } })
      .then(response => {
        this.group = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
        this.groupNotFound = error.response?.status === 404
      })
      .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getOperatorGroup()
  }
}
</script>
