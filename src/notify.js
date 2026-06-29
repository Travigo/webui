import axios from "axios"
import API from "@/API"
import { getToken } from "firebase/messaging"
import { UAParser } from "ua-parser-js"
import { getApiAccessToken } from "@/auth"

const PUSH_NOTIFICATION_TARGET_DEVICE_TYPE = "PWA"
const REMOVED_NOTIFICATION_TOKENS_STORAGE_KEY = "travigo_removed_notification_tokens"
const FIREBASE_VAPID_KEY = "BLbDyMEaWm3gNuSdan4mGyihI-R5vEUB-ANqH5pp8AczAOWSt7mVamXD4CiRREXV0Xh0qlPKa7jVyv2aPxP1S5E"

function getDeviceInfo() {
  const parser = new UAParser()
  const device = parser.getDevice()
  const normalisedDevice = normaliseDeviceInfo(device)

  return {
    deviceType: PUSH_NOTIFICATION_TARGET_DEVICE_TYPE,
    deviceVendor: normalisedDevice.vendor,
    deviceModel: normalisedDevice.model,
  }
}

function normaliseDeviceInfo(device) {
  const userAgent = navigator.userAgent || ""
  const platform = navigator.platform || ""
  const maxTouchPoints = navigator.maxTouchPoints || 0
  const vendor = device.vendor || (/Apple/.test(platform) || /iPhone|iPad|iPod|Macintosh/.test(userAgent) ? "Apple" : "")
  let model = device.model || ""

  if (/iPhone/.test(userAgent) || /iPhone/.test(platform)) {
    model = "iPhone"
  } else if (/iPad/.test(userAgent) || /iPad/.test(platform)) {
    model = "iPad"
  } else if (/iPod/.test(userAgent) || /iPod/.test(platform)) {
    model = "iPod"
  } else if (vendor === "Apple" && model === "Macintosh" && maxTouchPoints > 1) {
    model = Math.min(window.screen?.width || 0, window.screen?.height || 0) <= 430 ? "iPhone" : "iPad"
  }

  return {
    vendor,
    model
  }
}

export default {
  async setupNotifications(auth0, messagingObj, options = {}) {
    const permission = await this.ensureNotificationPermission(options.force === true)

    if (permission !== "granted") {
      return {
        status: "permission-denied"
      }
    }

    const currentToken = await this.getCurrentToken(messagingObj)

    if (!currentToken) {
      return {
        status: "no-token"
      }
    }

    if (options.force === true) {
      this.unmarkNotificationTokenRemoved(currentToken)
    } else if (this.isNotificationTokenRemoved(currentToken)) {
      return {
        status: "skipped-removed",
        token: currentToken
      }
    }

    await this.sendTokenToServer(auth0, currentToken)

    return {
      status: "registered",
      token: currentToken
    }
  },
  async ensureNotificationPermission(forceRequest = false) {
    if (!("Notification" in window)) {
      return "unsupported"
    }

    if (Notification.permission === "granted") {
      return "granted"
    }

    if (Notification.permission === "denied" || forceRequest !== true) {
      return Notification.permission
    }

    return Notification.requestPermission()
  },
  async getCurrentToken(messagingObj) {
    return getToken(messagingObj, { vapidKey: FIREBASE_VAPID_KEY })
  },
  async sendTokenToServer(auth0, fcmToken) {
    const auth0token = await getApiAccessToken(auth0)
    const config = {
      headers: { Authorization: `Bearer ${auth0token}` }
    }
    
    const response = await axios.post(`${API.URL}/core/account/notificationtoken`, {
      token: fcmToken,
      ...getDeviceInfo(),
    }, config)

    console.log('Notification/registerdevice', response.data)
    return response
  },
  async listNotificationTargets(auth0) {
    const auth0token = await getApiAccessToken(auth0)

    const response = await axios.get(`${API.URL}/core/account/notificationtoken`, {
      headers: { Authorization: `Bearer ${auth0token}` }
    })

    return response.data || []
  },
  async deleteNotificationTarget(auth0, target) {
    const token = this.getNotificationTargetToken(target)

    if (!token) {
      throw new Error("No notification token set")
    }

    const auth0token = await getApiAccessToken(auth0)
    const config = {
      headers: { Authorization: `Bearer ${auth0token}` },
      data: { token }
    }

    const response = await axios.delete(`${API.URL}/core/account/notificationtoken`, config)
    this.markNotificationTokenRemoved(token)

    return response
  },
  getNotificationTargetToken(target) {
    return target?.PushNotificationToken || target?.pushNotificationToken || target?.pushnotificationtoken || target?.token || ""
  },
  getRemovedNotificationTokens() {
    try {
      const storedTokens = JSON.parse(localStorage.getItem(REMOVED_NOTIFICATION_TOKENS_STORAGE_KEY) || "[]")

      return Array.isArray(storedTokens) ? storedTokens : []
    } catch (error) {
      console.log(error)

      return []
    }
  },
  setRemovedNotificationTokens(tokens) {
    localStorage.setItem(REMOVED_NOTIFICATION_TOKENS_STORAGE_KEY, JSON.stringify([...new Set(tokens)]))
  },
  isNotificationTokenRemoved(token) {
    return this.getRemovedNotificationTokens().includes(token)
  },
  markNotificationTokenRemoved(token) {
    this.setRemovedNotificationTokens([...this.getRemovedNotificationTokens(), token])
  },
  unmarkNotificationTokenRemoved(token) {
    this.setRemovedNotificationTokens(this.getRemovedNotificationTokens().filter(removedToken => removedToken !== token))
  },
  requestPermission() {
    return this.ensureNotificationPermission(true)
  }
}
