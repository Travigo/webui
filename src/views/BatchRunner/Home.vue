<template>
  <div class="space-y-4 pt-3 sm:space-y-5 sm:pt-4">
    <PageHeader
      eyebrow="Operations"
      title="Batch runner"
      :subtitle="activeScreen === 'create' ? 'Create a new scheduled data import run.' : 'Inspect workflow stages, task state, and logs.'"
      icon="manufacturing"
      variant="panel"
    >
      <template #actions>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition sm:rounded-2xl"
            :class="activeScreen === 'runs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'"
            @click="showRunsScreen"
          >
            <span class="material-symbols-outlined text-[20px]">history</span>
            Runs
          </button>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition sm:rounded-2xl"
            :class="activeScreen === 'create' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'"
            @click="showCreateScreen"
          >
            <span class="material-symbols-outlined text-[20px]">add_circle</span>
            New run
          </button>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:rounded-2xl"
            :disabled="!isAuthenticated || loadingRunner || refreshingRunner"
            @click="loadBatchRunner"
          >
            <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': loadingRunner || refreshingRunner }">
              {{ loadingRunner || refreshingRunner ? 'progress_activity' : 'refresh' }}
            </span>
            Refresh
          </button>
        </div>
      </template>

      <div v-if="activeRun" class="flex flex-wrap items-center gap-2">
        <span :class="statusClass(activeRun.status)">
          <span class="material-symbols-outlined text-[17px]">{{ statusIcon(activeRun.status) }}</span>
          {{ formatStatus(activeRun.status) }}
        </span>
        <span class="text-xs font-bold text-slate-500 dark:text-slate-400">
          Active: {{ activeRun.id }}
        </span>
      </div>
    </PageHeader>

    <LoadingState
      v-if="isAuthLoading || (loadingRunner && !plan)"
      title="Loading batch runner"
      subtitle="Fetching the import plan and recent runs."
      compact
      :show-tabs="false"
      :rows="4"
    />

    <Notice v-else-if="!isAuthenticated" type="warning" title="Sign in required">
      Sign in to access the batch runner.
    </Notice>

    <Notice v-else-if="batchRunnerError" type="error" title="Batch runner unavailable">
      {{ batchRunnerError }}
    </Notice>

    <section v-else-if="activeScreen === 'create'" class="space-y-4">
      <Panel title="Create run" subtitle="Choose workflow tasks and runtime options." icon="play_arrow" padded body-class="space-y-5">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <input
              v-model="forceImport"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
            >
            Force import
          </label>

          <label class="flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <input
              v-model="continueOnFailure"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
            >
            Continue after failures
          </label>

          <label class="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span>Max active tasks</span>
            <input
              v-model.number="maxActiveTasks"
              type="number"
              min="1"
              max="64"
              class="h-9 w-20 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold text-slate-900 focus:border-blue-400 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-2xl"
            :disabled="startingRun || selectedPlanTasks.size === 0"
            @click="startRun"
          >
            <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': startingRun }">
              {{ startingRun ? 'progress_activity' : 'play_arrow' }}
            </span>
            {{ startingRun ? 'Starting...' : 'Run selected' }}
          </button>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:rounded-2xl"
            @click="selectAllPlanTasks"
          >
            <span class="material-symbols-outlined text-[20px]">select_all</span>
            Select all
          </button>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:rounded-2xl"
            @click="selectNoPlanTasks"
          >
            <span class="material-symbols-outlined text-[20px]">deselect</span>
            Select none
          </button>

          <span class="text-xs font-bold text-slate-500 dark:text-slate-400">
            {{ selectedPlanTasks.size }} selected
          </span>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          <section
            v-for="group in planGroups"
            v-bind:key="group"
            class="py-4 first:pt-0 last:pb-0"
          >
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">
                  {{ groupLabel(group) }}
                </h3>
                <p class="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {{ selectedGroupCount(group) }} of {{ groupItems(group).length }} selected
                </p>
              </div>

              <button
                type="button"
                class="inline-flex h-8 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                @click="toggleGroupSelection(group)"
              >
                {{ isGroupFullySelected(group) ? 'Clear' : 'Select' }}
              </button>
            </div>

            <div v-if="groupItems(group).length === 0" class="text-sm font-medium text-slate-500 dark:text-slate-400">
              No tasks in this group.
            </div>

            <div v-else class="grid gap-2 sm:grid-cols-2">
              <label
                v-for="item in groupItems(group)"
                v-bind:key="item.identifier"
                class="flex min-w-0 items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
                  :checked="isPlanTaskSelected(item.identifier)"
                  @change="togglePlanTask(item.identifier, $event.target.checked)"
                >
                <span class="min-w-0">
                  <span class="block break-words text-sm font-bold text-slate-800 dark:text-slate-100">
                    {{ item.name || item.identifier }}
                  </span>
                  <span class="mt-0.5 block break-words text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {{ planItemMeta(item) }}
                  </span>
                </span>
              </label>
            </div>
          </section>
        </div>
      </Panel>
    </section>

    <section v-else class="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      <Panel title="Runs" subtitle="Recent batch executions." icon="history" :padded="false">
        <div v-if="runs.length === 0" class="px-4 py-5 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-5">
          No runs have been recorded yet.
        </div>

        <div v-else class="max-h-[42rem] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          <button
            v-for="run in runs"
            v-bind:key="run.id"
            type="button"
            class="block w-full px-4 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-blue-500/10 sm:px-5"
            :class="{ 'bg-blue-50 dark:bg-blue-500/10': run.id === selectedRunId }"
            @click="selectRun(run.id)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-sm font-extrabold text-slate-950 dark:text-slate-100">
                  {{ run.id }}
                </h2>
                <p class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {{ formatDate(run.createdAt) }}
                </p>
              </div>
              <span :class="statusClass(run.status, true)">
                {{ formatStatus(run.status) }}
              </span>
            </div>
          </button>
        </div>
      </Panel>

      <div class="space-y-4">
        <Panel title="Workflow run" subtitle="Stage state across the selected run." icon="account_tree" :padded="false">
          <template #actions>
            <button
              type="button"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              :disabled="!canCancelSelectedRun || cancellingRun"
              @click="cancelRun"
            >
              <span class="material-symbols-outlined text-[19px]" :class="{ 'animate-spin': cancellingRun }">
                {{ cancellingRun ? 'progress_activity' : 'cancel' }}
              </span>
              Cancel
            </button>
          </template>

          <div v-if="!selectedRunId" class="px-4 py-5 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-5">
            No run selected.
          </div>

          <div v-else-if="loadingDetail" class="flex items-center gap-3 px-4 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 sm:px-5">
            <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            Loading run detail
          </div>

          <div v-else-if="runDetailError" class="px-4 py-5 sm:px-5">
            <Notice type="error">
              {{ runDetailError }}
            </Notice>
          </div>

          <div v-else-if="selectedRun" class="divide-y divide-slate-100 dark:divide-slate-800">
            <div class="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
              <div class="min-w-0">
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <span :class="statusClass(selectedRun.status)">
                    <span class="material-symbols-outlined text-[17px]">{{ statusIcon(selectedRun.status) }}</span>
                    {{ formatStatus(selectedRun.status) }}
                  </span>
                  <span class="truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                    {{ selectedRun.id }}
                  </span>
                </div>
                <p v-if="selectedRun.error" class="text-sm font-medium text-red-600 dark:text-red-300">
                  {{ selectedRun.error }}
                </p>
              </div>

              <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-right">
                <dt>Created</dt>
                <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(selectedRun.createdAt) }}</dd>
                <dt>Started</dt>
                <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(selectedRun.startedAt) || '-' }}</dd>
                <dt>Finished</dt>
                <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(selectedRun.finishedAt) || '-' }}</dd>
              </dl>
            </div>

            <div class="grid divide-y divide-slate-100 dark:divide-slate-800 lg:grid-cols-[17rem_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
              <div class="max-h-[34rem] overflow-y-auto">
                <button
                  v-for="stage in workflowStages"
                  v-bind:key="stage.key"
                  type="button"
                  class="block w-full px-4 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-blue-500/10 sm:px-5"
                  :class="{ 'bg-blue-50 dark:bg-blue-500/10': stage.key === selectedStageKey }"
                  @click="selectStage(stage.key)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h3 class="truncate text-sm font-extrabold text-slate-950 dark:text-slate-100">{{ stage.name }}</h3>
                      <p class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {{ stageSummary(stage) }}
                      </p>
                    </div>
                    <span :class="statusClass(stage.status, true)">
                      {{ formatStatus(stage.status) }}
                    </span>
                  </div>
                </button>
              </div>

              <div class="min-w-0">
                <div v-if="!selectedWorkflowStage" class="px-4 py-5 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-5">
                  Select a workflow stage.
                </div>

                <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
                  <div class="px-4 py-4 sm:px-5">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-base font-extrabold text-slate-950 dark:text-slate-100">{{ selectedWorkflowStage.name }}</h3>
                      <span :class="statusClass(selectedWorkflowStage.status, true)">
                        {{ formatStatus(selectedWorkflowStage.status) }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {{ stageSummary(selectedWorkflowStage) }}
                    </p>
                  </div>

                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-100 text-left dark:divide-slate-800">
                      <thead class="bg-slate-50 text-xs font-extrabold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <tr>
                          <th scope="col" class="px-4 py-3 sm:px-5">Task</th>
                          <th scope="col" class="px-4 py-3">Status</th>
                          <th scope="col" class="px-4 py-3">Job</th>
                          <th scope="col" class="px-4 py-3">Error</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr
                          v-for="task in selectedStageTasks"
                          v-bind:key="task.id"
                          class="cursor-pointer transition hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          :class="{ 'bg-blue-50 dark:bg-blue-500/10': task.id === selectedTaskId }"
                          @click="selectTask(task.id)"
                        >
                          <td class="min-w-56 px-4 py-3 sm:px-5">
                            <div class="font-bold text-slate-900 dark:text-slate-100">{{ task.name }}</div>
                            <div class="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{{ task.kind }}</div>
                          </td>
                          <td class="px-4 py-3">
                            <span :class="statusClass(task.status, true)">
                              {{ formatStatus(task.status) }}
                            </span>
                          </td>
                          <td class="max-w-64 break-words px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                            {{ task.jobName || '-' }}
                          </td>
                          <td class="max-w-80 break-words px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300">
                            {{ task.error || '-' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          :title="selectedWorkflowStage ? `${selectedWorkflowStage.name} logs` : 'Stage logs'"
          subtitle="Logs are separated by task within the selected workflow stage."
          icon="article"
          :padded="false"
        >
          <div v-if="!selectedWorkflowStage" class="px-4 py-5 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-5">
            Select a workflow stage to view logs.
          </div>

          <div v-else-if="selectedStageTasks.length === 0" class="px-4 py-5 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-5">
            This stage has no tasks.
          </div>

          <div v-else>
            <div class="-mx-1 flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
              <button
                v-for="task in selectedStageTasks"
                v-bind:key="task.id"
                type="button"
                class="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-extrabold transition"
                :class="task.id === selectedTaskId ? 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'"
                @click="selectTask(task.id)"
              >
                <span :class="['h-2 w-2 rounded-full', statusDotClass(task.status)]"></span>
                {{ task.name }}
              </button>
            </div>

            <div v-if="loadingLog" class="flex items-center gap-3 px-4 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 sm:px-5">
              <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              Loading task log
            </div>

            <div v-else-if="logError" class="px-4 py-5 sm:px-5">
              <Notice type="error">
                {{ logError }}
              </Notice>
            </div>

            <pre v-else class="max-h-[32rem] min-h-72 overflow-auto bg-slate-950 px-4 py-4 text-xs leading-relaxed text-slate-100 sm:px-5">{{ selectedLog || 'No log output yet.' }}</pre>
          </div>
        </Panel>
      </div>
    </section>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import axios from 'axios'
import API from '@/API'
import { getApiAccessToken } from '@/auth'
import LoadingState from '@/components/LoadingState.vue'
import Notice from '@/components/Notice.vue'
import PageHeader from '@/components/PageHeader.vue'
import Panel from '@/components/Panel.vue'

const PLAN_GROUP_ORDER = ['small', 'medium', 'large', 'post-processing']

function auth0Value(value) {
  return value && typeof value === 'object' && 'value' in value ? value.value : value
}

export default {
  name: 'BatchRunnerHome',
  components: {
    LoadingState,
    Notice,
    PageHeader,
    Panel
  },
  data() {
    return {
      activeScreen: 'runs',
      auth0: useAuth0(),
      batchRunnerError: '',
      cancellingRun: false,
      continueOnFailure: true,
      forceImport: false,
      loadingDetail: false,
      loadingLog: false,
      loadingRunner: false,
      logError: '',
      maxActiveTasks: 1,
      plan: undefined,
      planTaskSelectionInitialized: false,
      refreshingRunner: false,
      runDetailError: '',
      runs: [],
      selectedLog: '',
      selectedPlanTasks: new Set(),
      selectedRun: undefined,
      selectedRunId: '',
      selectedStageKey: '',
      selectedTaskId: '',
      startingRun: false,
      refreshInterval: undefined
    }
  },
  computed: {
    activeRun() {
      return this.runs.find(run => this.isActiveStatus(run.status))
    },
    canCancelSelectedRun() {
      return this.isActiveStatus(this.selectedRun?.status)
    },
    isAuthenticated() {
      return auth0Value(this.auth0.isAuthenticated) === true
    },
    isAuthLoading() {
      return auth0Value(this.auth0.isLoading) === true
    },
    planGroups() {
      const groups = this.plan?.groups || {}
      const extraGroups = Object.keys(groups).filter(group => !PLAN_GROUP_ORDER.includes(group))

      return [...PLAN_GROUP_ORDER, ...extraGroups].filter(group => Array.isArray(groups[group]))
    },
    selectedStageTasks() {
      return this.selectedWorkflowStage?.tasks || []
    },
    selectedWorkflowStage() {
      return this.workflowStages.find(stage => stage.key === this.selectedStageKey)
    },
    workflowStages() {
      const tasks = this.selectedRun?.tasks || []
      const stages = []
      const stageIndexes = new Map()

      for (const task of tasks) {
        const key = this.taskStageKey(task)
        if (!stageIndexes.has(key)) {
          stageIndexes.set(key, stages.length)
          stages.push({
            key,
            name: this.taskStageName(task),
            tasks: []
          })
        }

        stages[stageIndexes.get(key)].tasks.push(task)
      }

      return stages.map(stage => ({
        ...stage,
        status: this.stageStatus(stage.tasks)
      }))
    }
  },
  watch: {
    isAuthenticated: {
      immediate: true,
      handler(isAuthenticated) {
        if (isAuthenticated) {
          this.loadBatchRunner()
          return
        }

        this.resetBatchRunner()
      }
    }
  },
  methods: {
    authHeaders(auth0token) {
      return {
        Authorization: `Bearer ${auth0token}`
      }
    },
    batchApiUrl(path) {
      const base = API.BATCH_URL.replace(/\/+$/, '')
      const suffix = String(path).replace(/^\/+/, '')

      return `${base}/${suffix}`
    },
    async batchApiGet(path, auth0token) {
      const response = await axios.get(this.batchApiUrl(path), {
        headers: this.authHeaders(auth0token)
      })

      return response.data
    },
    async batchApiPost(path, data, auth0token) {
      const response = await axios.post(this.batchApiUrl(path), data, {
        headers: this.authHeaders(auth0token)
      })

      return response.data
    },
    async batchApiText(path, auth0token) {
      const response = await axios.get(this.batchApiUrl(path), {
        headers: this.authHeaders(auth0token),
        responseType: 'text',
        transformResponse: [data => data]
      })

      return response.data
    },
    async loadBatchRunner(options = {}) {
      if (!this.isAuthenticated) {
        return
      }

      const silent = options.silent === true
      if (silent && (this.loadingRunner || this.refreshingRunner)) {
        return
      }

      this.batchRunnerError = ''
      this.loadingRunner = !silent
      this.refreshingRunner = silent

      try {
        const auth0token = await getApiAccessToken(this.auth0)
        const [plan, runs] = await Promise.all([
          this.batchApiGet('/api/plan', auth0token),
          this.batchApiGet('/api/runs', auth0token)
        ])

        this.plan = plan
        this.runs = this.normaliseRuns(runs)
        this.initialisePlanTaskSelection()
        this.reconcileSelectedRun()
        await this.loadSelectedRun(auth0token)
      } catch (error) {
        console.log(error)
        this.batchRunnerError = this.errorMessage(error, 'Batch runner could not be loaded.')
      } finally {
        this.loadingRunner = false
        this.refreshingRunner = false
      }
    },
    async loadSelectedRun(auth0token) {
      this.runDetailError = ''

      if (!this.selectedRunId) {
        this.selectedRun = undefined
        this.selectedStageKey = ''
        this.selectedTaskId = ''
        this.selectedLog = ''
        return
      }

      this.loadingDetail = true

      try {
        const token = auth0token || await getApiAccessToken(this.auth0)
        const run = await this.batchApiGet(`/api/runs/${encodeURIComponent(this.selectedRunId)}`, token)
        this.selectedRun = run
        this.reconcileSelectedStage()
        this.reconcileSelectedTask()
        await this.loadSelectedTaskLog(token)
      } catch (error) {
        console.log(error)
        this.selectedRun = undefined
        this.selectedLog = ''
        this.runDetailError = this.errorMessage(error, 'Run details could not be loaded.')
      } finally {
        this.loadingDetail = false
      }
    },
    async loadSelectedTaskLog(auth0token) {
      this.logError = ''

      if (!this.selectedRunId || !this.selectedTaskId) {
        this.selectedLog = ''
        return
      }

      this.loadingLog = true

      try {
        const token = auth0token || await getApiAccessToken(this.auth0)
        this.selectedLog = await this.batchApiText(`/api/runs/${encodeURIComponent(this.selectedRunId)}/tasks/${encodeURIComponent(this.selectedTaskId)}/log`, token)
      } catch (error) {
        console.log(error)
        this.selectedLog = ''
        this.logError = this.errorMessage(error, 'Task log could not be loaded.')
      } finally {
        this.loadingLog = false
      }
    },
    async startRun() {
      if (this.startingRun || this.selectedPlanTasks.size === 0) {
        return
      }

      this.startingRun = true

      try {
        const auth0token = await getApiAccessToken(this.auth0)
        const run = await this.batchApiPost('/api/runs', {
          taskIds: Array.from(this.selectedPlanTasks),
          includeAllTasks: false,
          forceImport: this.forceImport,
          maxActiveTasks: this.normalisedMaxActiveTasks(),
          continueOnFailure: this.continueOnFailure
        }, auth0token)

        this.selectedRunId = run.id
        this.selectedStageKey = ''
        this.selectedTaskId = ''
        this.activeScreen = 'runs'
        this.showToast(`Batch run ${run.id} started.`, 'success')
        await this.loadBatchRunner()
      } catch (error) {
        console.log(error)
        this.showToast(this.errorMessage(error, 'Batch run could not be started.'), 'error')
      } finally {
        this.startingRun = false
      }
    },
    async cancelRun() {
      if (!this.canCancelSelectedRun || this.cancellingRun) {
        return
      }

      this.cancellingRun = true

      try {
        const auth0token = await getApiAccessToken(this.auth0)
        await this.batchApiPost(`/api/runs/${encodeURIComponent(this.selectedRunId)}/cancel`, {}, auth0token)
        this.showToast(`Batch run ${this.selectedRunId} cancelled.`, 'success')
        await this.loadBatchRunner()
      } catch (error) {
        console.log(error)
        this.showToast(this.errorMessage(error, 'Batch run could not be cancelled.'), 'error')
      } finally {
        this.cancellingRun = false
      }
    },
    async selectRun(runId) {
      if (this.selectedRunId === runId) {
        return
      }

      this.selectedRunId = runId
      this.selectedStageKey = ''
      this.selectedTaskId = ''
      await this.loadSelectedRun()
    },
    async selectStage(stageKey) {
      if (this.selectedStageKey === stageKey) {
        return
      }

      this.selectedStageKey = stageKey
      this.selectedTaskId = ''
      this.reconcileSelectedTask()
      await this.loadSelectedTaskLog()
    },
    async selectTask(taskId) {
      if (this.selectedTaskId === taskId) {
        return
      }

      this.selectedTaskId = taskId
      await this.loadSelectedTaskLog()
    },
    showCreateScreen() {
      this.activeScreen = 'create'
    },
    showRunsScreen() {
      this.activeScreen = 'runs'
    },
    initialisePlanTaskSelection() {
      if (this.planTaskSelectionInitialized) {
        return
      }

      for (const group of this.planGroups) {
        for (const item of this.groupItems(group)) {
          this.selectedPlanTasks.add(item.identifier)
        }
      }

      this.selectedPlanTasks = new Set(this.selectedPlanTasks)
      this.planTaskSelectionInitialized = true
    },
    resetBatchRunner() {
      this.batchRunnerError = ''
      this.plan = undefined
      this.planTaskSelectionInitialized = false
      this.runs = []
      this.selectedLog = ''
      this.selectedPlanTasks = new Set()
      this.selectedRun = undefined
      this.selectedRunId = ''
      this.selectedStageKey = ''
      this.selectedTaskId = ''
    },
    normaliseRuns(runs) {
      if (!Array.isArray(runs)) {
        return []
      }

      return [...runs].sort((left, right) => {
        return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
      })
    },
    reconcileSelectedRun() {
      if (!this.runs.length) {
        this.selectedRunId = ''
        return
      }

      if (!this.selectedRunId || !this.runs.some(run => run.id === this.selectedRunId)) {
        this.selectedRunId = this.runs[0].id
      }
    },
    reconcileSelectedStage() {
      if (!this.workflowStages.length) {
        this.selectedStageKey = ''
        return
      }

      if (!this.selectedStageKey || !this.workflowStages.some(stage => stage.key === this.selectedStageKey)) {
        const activeStage = this.workflowStages.find(stage => this.isActiveStatus(stage.status))
        this.selectedStageKey = (activeStage || this.workflowStages[0]).key
      }
    },
    reconcileSelectedTask() {
      const tasks = this.selectedStageTasks

      if (!tasks.length) {
        this.selectedTaskId = ''
        return
      }

      if (!this.selectedTaskId || !tasks.some(task => task.id === this.selectedTaskId)) {
        const activeTask = tasks.find(task => this.isActiveStatus(task.status))
        this.selectedTaskId = (activeTask || tasks[0]).id
      }
    },
    normalisedMaxActiveTasks() {
      const value = Number(this.maxActiveTasks || 1)

      return Math.max(1, Math.min(64, Number.isFinite(value) ? value : 1))
    },
    groupItems(group) {
      return this.plan?.groups?.[group] || []
    },
    groupLabel(group) {
      return String(group)
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    },
    planItemMeta(item) {
      if (item.kind === 'dataset') {
        return [item.format, item.provider].filter(Boolean).join(' / ') || item.identifier
      }

      return item.kind || item.identifier
    },
    selectedGroupCount(group) {
      return this.groupItems(group).filter(item => this.selectedPlanTasks.has(item.identifier)).length
    },
    isGroupFullySelected(group) {
      const items = this.groupItems(group)

      return items.length > 0 && items.every(item => this.selectedPlanTasks.has(item.identifier))
    },
    toggleGroupSelection(group) {
      const selectedPlanTasks = new Set(this.selectedPlanTasks)
      const shouldSelect = !this.isGroupFullySelected(group)

      for (const item of this.groupItems(group)) {
        if (shouldSelect) {
          selectedPlanTasks.add(item.identifier)
        } else {
          selectedPlanTasks.delete(item.identifier)
        }
      }

      this.selectedPlanTasks = selectedPlanTasks
    },
    isPlanTaskSelected(identifier) {
      return this.selectedPlanTasks.has(identifier)
    },
    togglePlanTask(identifier, selected) {
      const selectedPlanTasks = new Set(this.selectedPlanTasks)

      if (selected) {
        selectedPlanTasks.add(identifier)
      } else {
        selectedPlanTasks.delete(identifier)
      }

      this.selectedPlanTasks = selectedPlanTasks
    },
    selectAllPlanTasks() {
      const selectedPlanTasks = new Set()

      for (const group of this.planGroups) {
        for (const item of this.groupItems(group)) {
          selectedPlanTasks.add(item.identifier)
        }
      }

      this.selectedPlanTasks = selectedPlanTasks
    },
    selectNoPlanTasks() {
      this.selectedPlanTasks = new Set()
    },
    taskStageKey(task) {
      if (task.kind === 'dataset') {
        return task.size || 'small'
      }

      return task.id
    },
    taskStageName(task) {
      if (task.kind === 'dataset') {
        return `${this.groupLabel(task.size || 'small')} imports`
      }

      return task.name || this.groupLabel(task.id)
    },
    stageStatus(tasks) {
      const statuses = tasks.map(task => String(task.status || '').toLowerCase())

      if (statuses.some(status => status === 'failed')) {
        return 'failed'
      }

      if (statuses.some(status => status === 'running')) {
        return 'running'
      }

      if (statuses.some(status => status === 'pending')) {
        return 'pending'
      }

      if (statuses.some(status => status === 'cancelled')) {
        return 'cancelled'
      }

      if (statuses.length > 0 && statuses.every(status => status === 'skipped')) {
        return 'skipped'
      }

      if (statuses.length > 0 && statuses.every(status => status === 'succeeded')) {
        return 'succeeded'
      }

      return statuses[0] || 'pending'
    },
    stageSummary(stage) {
      const counts = stage.tasks.reduce((result, task) => {
        const status = String(task.status || 'unknown').toLowerCase()
        result[status] = (result[status] || 0) + 1
        return result
      }, {})
      const details = ['running', 'pending', 'failed', 'succeeded', 'cancelled', 'skipped']
        .filter(status => counts[status])
        .map(status => `${counts[status]} ${status}`)

      return `${stage.tasks.length} task${stage.tasks.length === 1 ? '' : 's'}${details.length ? `: ${details.join(', ')}` : ''}`
    },
    isActiveStatus(status) {
      return ['pending', 'running'].includes(String(status || '').toLowerCase())
    },
    formatStatus(status) {
      const value = String(status || 'unknown')

      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    statusIcon(status) {
      return {
        succeeded: 'check_circle',
        failed: 'error',
        running: 'progress_activity',
        pending: 'schedule',
        cancelled: 'cancel',
        skipped: 'skip_next'
      }[String(status || '').toLowerCase()] || 'info'
    },
    statusClass(status, compact = false) {
      const base = compact
        ? 'inline-flex h-7 shrink-0 items-center rounded-lg border px-2 text-xs font-extrabold'
        : 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-extrabold'
      const tone = {
        succeeded: 'border-green-100 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100',
        failed: 'border-red-100 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100',
        running: 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
        pending: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100',
        cancelled: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
        skipped: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
      }[String(status || '').toLowerCase()] || 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'

      return `${base} ${tone}`
    },
    statusDotClass(status) {
      return {
        succeeded: 'bg-green-500',
        failed: 'bg-red-500',
        running: 'bg-amber-500',
        pending: 'bg-blue-500',
        cancelled: 'bg-slate-400',
        skipped: 'bg-slate-400'
      }[String(status || '').toLowerCase()] || 'bg-slate-400'
    },
    formatDate(value) {
      if (!value) {
        return ''
      }

      return new Date(value).toLocaleString()
    },
    errorMessage(error, fallback) {
      return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback
    },
    showToast(message, type = 'info') {
      window.dispatchEvent(new CustomEvent('travigo-toast', {
        detail: {
          message,
          type
        }
      }))
    },
    pollBatchRunner() {
      if (!this.isAuthenticated) {
        return
      }

      if (this.activeRun || this.selectedRunId) {
        this.loadBatchRunner({ silent: true })
      }
    }
  },
  mounted() {
    this.refreshInterval = window.setInterval(this.pollBatchRunner, 4000)
  },
  beforeUnmount() {
    window.clearInterval(this.refreshInterval)
  }
}
</script>
