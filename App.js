import { Button, StyleSheet, Text, View } from 'react-native'
import { useState, useEffect } from 'react'
import { getCurrentPositionAsync, requestBackgroundPermissionsAsync, startGeofencingAsync, GeofencingEventType } from 'expo-location';
import * as TaskManager from 'expo-task-manager';


TaskManager.defineTask('blah', ({ data: { eventType, region }, error }) => {
  if (error) {
    // check `error.message` for more details.
    return;
  }
  if (eventType === GeofencingEventType.Enter) {
    console.log("You've entered region:", region);
  } else if (eventType === GeofencingEventType.Exit) {
    console.log("You've left region:", region);
  }
})


export default function App() {
  const [locationPermission, setLocationPermission] = useState(false)
  const [location, setLocation] = useState(null)

  useEffect(() => {
    (async () => {
      const { status } = await requestBackgroundPermissionsAsync()
      console.log('status')
      console.log(status)
      if (status === 'granted') {
        console.log('setting location yo...')
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
