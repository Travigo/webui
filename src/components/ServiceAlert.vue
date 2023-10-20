<template>
  <Alert :type="this.styles[alert.AlertType]['alertType']">
    <strong v-if="alert.Title != ''">{{ alert.Title }}</strong>
    <strong v-else>{{ this.styles[alert.AlertType]['title'] }}</strong>
    <br/>
    {{ alert.Text }}
  </Alert>
</template>

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
        }
      }
    }
  }
}
</script>
