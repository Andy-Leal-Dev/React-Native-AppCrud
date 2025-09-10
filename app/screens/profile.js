import { View, Text, StyleSheet, ScrollView  } from "react-native";
import Constants from 'expo-constants';
export default  function ProfileScreen(){

        return(
        <View style={styles.container}>
            <ScrollView>
        
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Constants.statusBarHeight
  },
})