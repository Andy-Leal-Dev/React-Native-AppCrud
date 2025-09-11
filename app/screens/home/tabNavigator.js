import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './home'; // Assuming HomeScreen is the main component for the Home tab
import ProfileScreen from './profile'; // Import your Profile screen
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importing icons
import StackNavigator from './stackNavigation';

const Tab = createBottomTabNavigator();

export default function HomeTabNavigator() {
    return (
        <Tab.Navigator>
            <Tab.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{
                headerShown:false,
                tabBarLabel: 'Inicio', 
                tabBarIcon:({color, size})=>( <MaterialCommunityIcons name="home" color={color} size={25}/>)}}  
            />
            <Tab.Screen 
                name="Profile" 
                component={StackNavigator} 
                options={{
                headerShown:false,
                tabBarLabel: 'Mi Perfil', 
                tabBarIcon:({color, size})=>(
                    <MaterialCommunityIcons name="account-circle" size={24} color={color} />
                )}}
            />
           
        </Tab.Navigator>
    );
}