<template>
  <div>
    <PageTitle>
      Assistant
    </PageTitle>
    <Card>
      <div>
        <div
          class="pb-2"
          v-for="(message, index) in this.messageHistory" v-bind:key="index"
        >
          <h3 class="text-gray-500 font-semibold text-lg">{{ message.actor }}</h3>
          {{ message.text }}
        </div>
      </div>
    </Card>

    <div class="absolute bottom-5 z-50">
        <input type="text" id="destination" 
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Enter your message" required
          v-model="userMessage"
          autocomplete="off"
        />
        <button 
          type="submit" 
          class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          @click.stop.prevent="submit()"
        >
          Send
        </button>
    </div>
  </div>
</template>

<script>
import Card from '@/components/Card.vue'
import PageTitle from '@/components/PageTitle.vue'

export default {
  name: 'AssistantHome',
  components: {
    Card,
    PageTitle,
  },
  data(){
    return {
      messageHistory: [
        {"actor": "user", "text": "Hi"},
        {"actor": "ai", "text": "Hello there"},
        {"actor": "user", "text": "Can you help me?"},
        {"actor": "user", "text": "No"}
      ],
      userMessage: ""
    }
  },
  methods: {
    submit(){
      this.messageHistory.push({"actor": "user", "text": this.userMessage})
    }
  }
}
</script>