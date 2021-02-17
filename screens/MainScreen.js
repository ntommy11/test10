import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ActivityIndicator,FlatList } from 'react-native';
import {Header} from 'react-native-elements';
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery } from "@apollo/client";

import { GET_USERID } from "../queries";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, EvilIcons,Entypo } from '@expo/vector-icons';

import { UserContext,IdContext } from '../components/context';
 
import AccountScreen from './AccountScreen';
import HomeScreen from './HomeScreen';
import {KeepScreen, KeepUpload} from './KeepScreen';
import ScheduleStackScreen from './ScheduleStackScreen';
import {Community,Post,Upload,UploadHeader}from "./MainContent"

import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native'
import {
  AdMobBanner,
  AdMobInterstitial,
} from 'expo-ads-admob';

import {SEE_BOARD} from '../queries'
const Tab = createBottomTabNavigator();

const MoveBoard = ({navigation})=>{ //추가
  const {loading, error, data} = useQuery(SEE_BOARD,{
    fetchPolicy: "no-cache"
  });
  if(loading)return <ActivityIndicator color="#1478FF"/>
  if(error)return <Text>에러!!</Text>
  console.log(data)
  return (
    <FlatList
      keyExtractor={(board) => board.id.toString()}
      data = {data.seeAllBoard} 
      renderItem ={(board)=>{ 
        //console.log("어슈발뭐지??",post);
      
          return (
            <TouchableOpacity  style={styles.card}
            onPress={()=>{navigation.navigate("Community",{id: board.item.id, name:board.item.name,type:board.item.type, needquery:true})}} >
          
              <Text style={{fontSize:20}}>{board.item.name}</Text>
            </TouchableOpacity>
        );
          }}
      windowSize = {2}
      />
  );

}
  
const MainContent = ({navigation}) => {//변경
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
  })
  const isFocused = useIsFocused();
  return(
    isFocused ? 
    <ApolloProvider client = {client}>
      <MoveBoard navigation={navigation}/>
  </ApolloProvider>
  :
  <View></View>
  );

}
const TwoLineText = () =>{
    return(
      <View style={{paddingTop:10}}>
        <Text style={{color:"white", fontSize:10 }}>서울과학기술대학교 미래융합대학</Text>
        <Text style={{color:"white", fontSize:21, fontWeight:"700"}}>학교생활 도우미</Text>
      </View>
    )
  }

  const Stack =createStackNavigator();
 



const URI_LMS = "https://future.seoultech.ac.kr/login/index.php";
const URI_HOME  = "https://m-disciplinary.seoultech.ac.kr/";
const URI_PORTAL = "http://portal.seoultech.ac.kr/";


const WebviewLMS = ()=>{
  return <WebView source={{uri:URI_LMS}}/>
}
const WebviewHome = ()=>{
  return <WebView source={{uri:URI_HOME}}/>
}
const WebviewPortal = ()=>{
  return <WebView source={{uri:URI_PORTAL}}/>
}

export default function MainScreen(){
  const userInfo = React.useContext(UserContext);
  const{loading, error, data} = useQuery(GET_USERID,{
    variables: {email: userInfo.email},
    fetchPolicy:"no-cache" 
  })  

  if(loading) return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
      <ActivityIndicator size="large" color="#1478FF"/>
    </View>
  );
  if(error) return(<Text>에러!!{error}</Text>);
  let id = data.findUserbyName[0].id
  let grade = data.findUserbyName[0].grade
  if(grade >= 2){
    AdMobInterstitial.setAdUnitID("ca-app-pub-8233357974153609/1707547735").then(()=>{
      AdMobInterstitial.requestAdAsync().then(()=>AdMobInterstitial.showAdAsync());
    });
  }
  const temp ={id: id, grade: grade} 
    //console.log("temp",temp);
      return ( 
        <IdContext.Provider value = {temp} >

        <Stack.Navigator>
          <Stack.Screen name="default" component={DefaultScreen} options={{headerShown: false}}/>
          <Stack.Screen name="Community" component={Community} />
          <Stack.Screen name="Post" component={Post} /> 
          <Stack.Screen name="Upload" component={Upload} options={{headerShown: false}} />
          <Stack.Screen name="계정" component={AccountScreen}/>
          <Stack.Screen name="WebviewLMS" component={WebviewLMS}/>
          <Stack.Screen name="WebviewHome" component={WebviewHome}/>
          <Stack.Screen name="WebviewPortal" component={WebviewPortal}/>
          <Stack.Screen name="keepUpload" component={KeepUpload} options={{headerShown: false} }/>
         </Stack.Navigator>
         </IdContext.Provider>
    );
  }



export function DefaultScreen({navigation}) {
    const user_meta = React.useContext(IdContext);
        
    return (
        <>
          {
            //user_meta.grade > 1? showInterstitial():null
          }
          <Header
            placement="left"
            centerComponent={TwoLineText}
            rightComponent={
              <View style={{flexDirection:"row"}}>
                <TouchableOpacity 
                  style={{marginTop:10}}
                  onPress= {()=>{navigation.navigate("계정")}}
                ><EvilIcons name="user" size={32} color="white"/>
                </TouchableOpacity>
              </View>

            }
            containerStyle={{
              backgroundColor: '#0A6EFF'
            }}
          />
            {
              user_meta.grade>1?
              <AdMobBanner
                style={styles.adcard}
                adUnitID="ca-app-pub-8233357974153609/8459668669" // Test ID, Replace with your-admob-unit-id
                servePersonalizedAds // true or false
                onDidFailToReceiveAdWithError={this.bannerError} 
              />
              :
              null
            }

 
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
  
                if (route.name === '홈') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === '시간표') {
                  iconName = focused ? 'time' : 'time-outline';
                } else if (route.name === '메모') {
                  iconName = focused ? 'md-book' : 'md-book-outline';
                } else if (route.name === '커뮤니티') {
                  iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                }
   
                // You can return any component that you like here!
                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}
            tabBarOptions={{
              activeTintColor: '#148CFF',
              inactiveTintColor: '#dcdcdc',
              labelPosition: 'below-icon'
            }}
            
          >
            <Tab.Screen name="홈" component={HomeScreen} />
            <Tab.Screen name="시간표" component={ScheduleStackScreen} />
            <Tab.Screen name="메모" component={KeepScreen} />
            <Tab.Screen name="커뮤니티" component={MainContent} />
          </Tab.Navigator>
        </>
    );
}


function AD(){
  const [showAD, setShowAD] = React.useState(true);
  return(
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAD}
      onRequestClose={() => {
        Alert.alert('Modal has been closed.');
      }}>
      <View style={{justifyContent:"center", flex:1}}>
        <AdMobBanner
          style={styles.adcard}
          bannerSize="mediumRectangle"
          adUnitID="ca-app-pub-8233357974153609/1707547735" // Test ID, Replace with your-admob-unit-id
          servePersonalizedAds // true or false
          onDidFailToReceiveAdWithError={this.bannerError} />
        
        <TouchableOpacity style={styles.adButton} onPress={()=>{
          setShowAD(false);
        }}><Text style={{fontSize:20, color:"white"}}>닫기</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}



const styles = StyleSheet.create({
    card2: {
      padding: 10,
      marginVertical: 5,
      marginHorizontal: 25,
      borderWidth: 1,
      borderColor: "#dcdcdc",
      borderRadius: 10,
      textAlign: "center",
      justifyContent: "center",
    },
    card: { //card자체수정
      backgroundColor: "white",
      padding: 10,
      margin: 1,
      borderWidth: 1,
      borderColor: "#dcdcdc",
      borderRadius: 5,
      flexDirection: 'row' 
    },
    date: {
      margin: 5,
      color: "blue",
      fontSize: 15,
      borderColor: "black",
      textAlign: "center",
      justifyContent: "center",
    },
    time: {
      margin: 5,
      fontWeight: "600",
      fontSize: 20,
      textAlign: "center",
    },
    subject: {
      textAlign: "center",
      fontSize: 30,
      fontWeight: "600",
    },
    location: {
      textAlign: "center",
      fontSize: 10,
      color: "#646464",
    },
    week: {
      margin: 5,
      textAlign: "center",
      fontSize: 10,
      color: "#646464",
    },
    where: {
      marginTop: 7,
      padding: 3,
      borderRadius: 10,
      backgroundColor: "#dcdcdc",
      alignSelf: "center",
      fontSize: 10,
      color: "grey",
    },
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    button: {
      alignItems: "center",
      backgroundColor: "#DDDDDD",
      padding: 10
    }, 
    line: {
      backgroundColor: "#ffffff",
      borderBottomColor: 'black',
      borderBottomWidth: 1,
    },
    adButton: {
      alignItems: 'center',
      justifyContent: "center",
      marginVertical: 10,
      marginHorizontal: 50,
      //borderStyle:"dashed", 
      //borderWidth:1,
      padding:10,
      borderRadius: 10,
      backgroundColor: "red",
      borderColor: "white"
    },
    adcard:{
      marginVertical: 5,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
  });