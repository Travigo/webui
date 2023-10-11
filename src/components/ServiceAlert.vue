<template>
  <Alert :type="this.styles[alert.AlertType]['alertType']">
    <strong>{{ this.styles[alert.AlertType]['title'] }}</strong><br/>
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
        'Disruption': {
          'alertType': 'warning',
          'title': 'Disruption',
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
