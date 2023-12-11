<template>
  <Alert :type="this.styles[alert.AlertType]['alertType']" class="t-service-alert">
    <strong v-if="alert.Title != ''">{{ alert.Title }}</strong>
    <strong v-else>{{ this.styles[alert.AlertType]['title'] }}</strong>
    <br/>
    <div v-html="alert.Text"></div>
  </Alert>
</template>

<style lang="scss">
.t-service-alert {
  a:link {
    color: blue;
    text-decoration: underline;
  }

  /* visited link */
  a:visited {
    color: blue;
  }

  /* mouse over link */
  a:hover {
    color: rgb(49, 21, 125);
  }

  /* selected link */
  a:active {
    color: blue;
  }
}
</style>

<script>
import Alert from '@/components/Alert.vue'

export default {
  props: {
    alert: {}
  },
  components: {
    Alert,
  },
  data () {
    return {
      styles: {
        'Information': {
          'alertType': 'info',
          'title': 'Information',
          'icon': ''
        },
        'Warning': {
          'alertType': 'warning',
          'title': 'Warning',
          'icon': ''
        },
        'StopClosed': {
          'alertType': 'error',
          'title': 'Stop Closed',
          'icon': ''
        },
        'ServiceSuspended': {
          'alertType': 'error',
          'title': 'Service Suspended',
          'icon': ''
        },
        'ServicePartSuspended': {
          'alertType': 'error',
          'title': 'Service Part Suspended',
          'icon': ''
        },
        'SevereDelays': {
          'alertType': 'error',
          'title': 'Severe Delays',
          'icon': ''
        },
        'Delays': {
          'alertType': 'warning',
          'title': 'Delays',
          'icon': ''
        },
        'MinorDelays': {
          'alertType': 'warning',
          'title': 'Minor Delays',
          'icon': ''
        },
        'Planned': {
          'alertType': 'info',
          'title': 'Planned Notice',
          'icon': ''
        },
        'JourneyDelayed': {
          'alertType': 'warning',
          'title': 'Journey Delayed',
          'icon': ''
        },
        'JourneyCancelled': {
          'alertType': 'error',
          'title': 'Journey Cancelled',
          'icon': ''
        },
      }
    }
  }
}
</script>
