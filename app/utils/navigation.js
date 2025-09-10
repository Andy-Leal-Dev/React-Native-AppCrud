
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/home";
import ProfileScreen from "../screens/profile";
import { NavigationContainer } from "@react-navigation/native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
const Tab = createBottomTabNavigator();

function MyTabs(){
    return (
        <Tab.Navigator initialRouteName="Home" screenOptions={{
            tabBarActiveTintColor: '#4943c2ff'
        }}>
            <Tab.Screen 
            name="Home" 
            
            component={HomeScreen}
            options={{
                headerShown:false,
                tabBarLabel: 'Inicio', 
                tabBarIcon:({color, size})=>( <MaterialCommunityIcons name="home" color={color} size={25}/>)}} />
            <Tab.Screen name="Profile" 
            component={ProfileScreen} 
            options={{
                headerShown:false,
                tabBarLabel: 'Mi Perfil', 
                tabBarIcon:({color, size})=>(
                    <MaterialCommunityIcons name="account-circle" size={24} color={color} />
                )}}/>
        </Tab.Navigator>
    );
}

export default function Navigation(){
    return( 
        <NavigationContainer>
            <MyTabs/>
        </NavigationContainer>
    );
}