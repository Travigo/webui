<template>
  <div class="space-y-4 p-4 sm:p-5">
    <section class="grid gap-3 sm:grid-cols-2" v-if="contactItems.length > 0">
      <a
        v-for="item in contactItems"
        v-bind:key="item.label"
        :href="item.href"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer noopener' : undefined"
        class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-blue-50"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
          <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-xs font-semibold text-slate-500">{{ item.label }}</span>
          <span class="block truncate text-sm font-extrabold text-slate-950">{{ item.value }}</span>
        </span>
        <span class="material-symbols-outlined text-[18px] text-slate-400">{{ item.external ? 'open_in_new' : 'chevron_right' }}</span>
      </a>
    </section>

    <section class="rounded-2xl bg-slate-50 p-4" v-if="operator.OperatorGroup">
      <p class="text-xs font-semibold text-slate-500">Operator group</p>
      <router-link
        :to="{'name': 'operators/view_group', params: {'id': operator.OperatorGroup.Identifier}}"
        class="mt-1 inline-flex items-center gap-1 text-base font-extrabold text-blue-600 transition hover:text-blue-700"
      >
        {{ operator.OperatorGroup.Name }}
        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
      </router-link>
    </section>

    <section class="rounded-2xl bg-slate-50 p-4" v-if="operator.OtherNames?.length > 0">
      <p class="text-xs font-semibold text-slate-500">Also known as</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="name in operator.OtherNames"
          v-bind:key="name"
          class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm"
        >
          {{ name }}
        </span>
      </div>
    </section>

    <section class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800" v-if="contactItems.length === 0 && !operator.OperatorGroup && !operator.OtherNames?.length">
      No extra operator information is available.
    </section>
  </div>
</template>

<script>
export default {
  props: {
    operator: {},
  },
  computed: {
    contactItems() {
      const items = []

      if (this.operator.Website) {
        items.push({
          label: 'Website',
          value: this.operator.Website,
          href: this.operator.Website,
          icon: 'language',
          external: true
        })
      }

      if (this.operator.Email) {
        items.push({
          label: 'Email',
          value: this.operator.Email,
          href: `mailto:${this.operator.Email}`,
          icon: 'mail',
          external: false
        })
      }

      if (this.operator.PhoneNumber) {
        items.push({
          label: 'Phone',
          value: this.operator.PhoneNumber,
          href: `tel:${this.operator.PhoneNumber}`,
          icon: 'call',
          external: false
        })
      }

      if (this.operator.SocialMedia?.Twitter) {
        items.push({
          label: 'Twitter',
          value: `@${this.operator.SocialMedia.Twitter}`,
          href: `https://twitter.com/${this.operator.SocialMedia.Twitter}`,
          icon: 'alternate_email',
          external: true
        })
      }

      return items
    }
  }
}
</script>
