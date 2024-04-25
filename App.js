import { Platform, StyleSheet, Text, View } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { getCurrentPositionAsync, requestForegroundPermissionsAsync, requestBackgroundPermissionsAsync, startGeofencingAsync, GeofencingEventType } from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask('blah', async ({ data: { eventType, region }, error }) => {
  if (error) {
    // check `error.message` for more details.
    return;
  }
  if (eventType === GeofencingEventType.Enter) {
    console.log("You've entered region:", region);
    await schedulePushNotification('You entered the fence');

  } else if (eventType === GeofencingEventType.Exit) {
    console.log("You've left region:", region);
    await schedulePushNotification('You left the fence');
  }
})


async function schedulePushNotification(bodyText) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "GeoNotify",
      body: bodyText,
      data: { data: 'goes here' },
    },
    trigger: { seconds: 1 },
  });
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

export default function App() {
  const [locationPermission, setLocationPermission] = useState(false)
  const [location, setLocation] = useState(null)
  const [inFence, setInFence] = useState(false)


  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);


  useEffect(() => {
    (async () => {
      const { statusA } = await requestForegroundPermissionsAsync()

      const { status } = await requestBackgroundPermissionsAsync()
      if (status === 'granted') {
        setLocationPermission(true)
        const location = await getCurrentPositionAsync({})
        setLocation(location)

        startGeofencingAsync('blah', [{latitude: location.coords.latitude, longitude: location.coords.longitude, radius: 2}])
      }
    })()
  }, [])
  console.log(location)

  if (locationPermission) {
    return (
      <View style={styles.container}>
        {
          location && (
            <>
              <Text style={styles.heading}>Location as of {new Date(location.timestamp).toLocaleTimeString()}</Text>
              <Text>Lat: {location.coords.latitude}</Text>
              <Text>Long: {location.coords.longitude}</Text>
            </>
          )
        }
      </View>
    )
  } else {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Location permission required!</Text>
        <Text>In order to continue, please give GeoNotify the required permission.</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold'
  }
})
