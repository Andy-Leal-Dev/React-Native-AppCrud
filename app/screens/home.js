import { View,Text, ScrollView, StyleSheet, Button, TextInput, Touchable, TouchableOpacity, Pressable } from "react-native";
import Constants from 'expo-constants';
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen(){

    return(
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.textHeader}>Hola! Pedro XXXXXX</Text>
                    <View style={styles.ViewSearch}>
                        <TextInput placeholder="Ingrese el Titulo de la Nota" /> 
                        <TouchableOpacity>
                            <Ionicons name="search-sharp" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.containerCardNote}>
                    <Pressable>
                        <View style={styles.cardNote}>

                        </View>
                    </Pressable>

                </View>
                
            </ScrollView>
            <TouchableOpacity style={styles.floatingButton}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight,

    paddingHorizontal: 10,
    height: '100%'
  },
  header:{
    paddingTop:20,
    paddingHorizontal: 5,
    alignContent: 'flex-start',
    justifyContent: 'flex-start'
  },
  textHeader:{
    fontSize: 20,
    marginBottom:10,
    marginLeft: 10
  },
  ViewSearch:{
    flexDirection:'row',
    justifyContent: 'space-between',
    alignItems:'center',
    width: 380,
    height:60,
    backgroundColor: '#D3D3D3',
    borderRadius: 20,
    paddingLeft:10,
    paddingRight: 20
  },
  inputSearch:{
    width: 250,
  },
  btnSearch:{

  },
  containerCardNote:{
    justifyContent: "center",
    alignItems: "center",
  },
  cardNote:{
    width:"95%",
    height:150,
    borderRadius: 20,
    backgroundColor:"white",
    elevation: 5, // For Android shadow
    shadowColor: "#000", // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop:20
  },
  floatingButton: {
    backgroundColor: '#4943c2ff', // Replace with your primary color
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    right: 30,
    elevation: 5, // For Android shadow
    shadowColor: "#000", // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});