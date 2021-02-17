import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { ApolloClient, InMemoryCache, useQuery, ApolloProvider } from "@apollo/client";
import { AuthContext, UserContext } from '../components/context';
import { SEE_REGIST_LECTURE, SEE_ALL_POST, POST_LOAD } from '../queries';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { Ionicons, EvilIcons} from '@expo/vector-icons'; 
import { WebView } from 'react-native-webview'
import { ScrollView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-community/async-storage';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';

const URI_LMS = "https://future.seoultech.ac.kr/login/index.php";
const URI_HOME  = "https://m-disciplinary.seoultech.ac.kr/";
const URI_PORTAL = "http://portal.seoultech.ac.kr/";

const NOTIF_BOARD_ID = 6 //공지사항 게시판 ID
const STU_NOTIF_BOARD_ID = 8 //학생회알림 게시판 ID

const NOW = new Date();
const TIMEZONE = NOW.getTimezoneOffset()*60000;

const weekday = ['일','월', '화', '수', '목', '금', '토'];

// 객체가 비어있는지 확인하는 함수 
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}

// 홈 탭에서 직후 일정 콤포넌트
const CardInfo = ({current_class}) => {
  //console.log("current class at CardInfo: ", current_class);
  // 더이상 수업이 없는 경우 처리
  if (current_class == undefined || current_class.start_time < NOW){
    const NOW = new Date();
    let year = NOW.getFullYear();
    let month = NOW.getMonth()+1;
    let date = NOW.getDate();
    let day = weekday[NOW.getDay()];
    return (
      <View style={styles.card}>
        <Text style={styles.date}>{year}년 {month}월 {date}일 {day}요일</Text>
        <Text style={styles.subject}> 현재 수업이 없습니다</Text>
      </View>
    )
  }
  // 현재 수업 데이터 전처리
  let year = current_class.start_time.getFullYear();
  let month = current_class.start_time.getMonth()+1;
  let date = current_class.start_time.getDate();
  let day = weekday[current_class.start_time.getDay()];
  let hours = current_class.start_time.getHours();
  let minutes = current_class.start_time.getMinutes();
  

  return (
    <View style={styles.card}>
      <Text style={styles.date}>{year}년 {month}월 {date}일 {day}요일</Text>
      <Text style={styles.time}>{hours>=10? hours: `0${hours}`}:{minutes >= 10? minutes: `0${minutes}`}</Text>
      <Text style={styles.subject}>{current_class.name}</Text>
      <Text style={styles.week}>{current_class.week}주차</Text>
      <View style={styles.where}>
        <View style={{flex:3}}>
          <Text style={styles.location}> {current_class.vod? "VOD":"SC"} </Text>
        </View>
        <View style={{flex:1}}>
          <Text style={styles.location}>|</Text>
        </View>
        <View style={{flex:3}}>
        <Text style={styles.location}>{current_class.room}</Text>
        </View>
      </View>
    </View>
  )
}

// 홈 탭에서 다음 일정 콤포넌트
const CardInfo2 = ({next_class}) => {
  //console.log("next class in CardInfo2: ", next_class);
  if (next_class == undefined || next_class.start_time < NOW){
    return (
      <View style={styles.card2}>
        <Text style={{ color: "#787878" }}>일정이 더이상 없습니다.</Text>
      </View>
    )
  }
  let name = next_class.name;
  let room = next_class.room;
  let month = next_class.start_time.getMonth()+1;
  let date = next_class.start_time.getDate();
  let day = weekday[next_class.start_time.getDay()];
  let hours = next_class.start_time.getHours();
  let minutes = next_class.start_time.getMinutes();
  return (
    <View style={styles.card2}>
      <Text style={{ color: "#787878" }}>{name} - {month}월 {date}일 {hours>=10? hours: `0${hours}`}:{minutes >= 10? minutes: `0${minutes}`} {room} </Text>
    </View>
  )
}


const Notification = ({navigation, bid}) => {
  const user = React.useContext(UserContext);
  const [lastNotif, setLastNotif] = React.useState(user.lastNotif);
  setAsyncStorage = () => {
    AsyncStorage.setItem("lastNotif", lastNotif);
  }
  /*
  const setLastNotif = (current) =>{
    let lastNotif = user.lastNotif;
    console.log(lastNotif);
    if (lastNotif == null){ // 마지막으로 읽은 공지가 없다?
      try{
        AsyncStorage.setItem("lastNotif", current);
      }catch(e){
        console.log(e);
      }
    }
    else{ // 마지막으로 읽은 공지가 있으면 비교해서 최근 것으로 대체
      if(current > lastNotif){
        AsyncStorage.setItem("lastNotif", current);
      }
    }
  }
  */

  const { loading, error, data } = useQuery(POST_LOAD,{
    variables:{
      bid: bid,
      snum: 0,
      tnum: 2,
    }
  });

  //console.log("Notification loading: ",loading);
  //console.log("Notification data   : " , data);
  //console.log("Notification error  : ", error );
  

  if(loading){
    return(
      <View style={styles.card2}>
        <ActivityIndicator color="#1478FF"/>
      </View>
    )
  }
  if(data){
    let posts = data.loadPost;
    //console.log("posts: ", posts);
    if(posts.length==0){
      return(
        <View style={styles.card2}>
          <Text style={{ color: "#787878" }}>공지가 없습니다</Text>
        </View>
      )
    }
    AsyncStorage.getItem('notified', (err,res)=>{
      if (res=="NO"){
        AsyncStorage.getItem('lastNotif', (err,res)=>{
          if (Number(res) < Number(posts[0].createdAt) || res == null){
            console.log("공지 알림 등록!");
            AsyncStorage.setItem('notified', "YES");
            Notifications.scheduleNotificationAsync({
              content:{
                title: '새로운 공지 알림',
                body: `아직 확인하지 않은 새로운 공지가 있습니다. ${posts[0].title}`,
                sound: 'default'
              },
              trigger: null,
            });
          }
        });
      }
    })

    return (
      <View style={styles.card2}>
        {
          posts.map((post, index)=>{
            return(
              <TouchableOpacity 
                key={index}
                style={styles.notificationList} 
                onPress= {()=>{
                  // 마지막으로 읽은 공지 최신화
                  AsyncStorage.getItem('lastNotif', (err, res)=>{
                    console.log("res: ",res);
                    if( Number(res) < Number(post.createdAt)){
                      AsyncStorage.setItem('lastNotif', post.createdAt, ()=>{
                        console.log(`lastNotif:${post.createdAt} 저장완료`)
                      });
                    }
                  });
                  navigation.navigate("Post",{
                  id:post.id, 
                  title: post.title, 
                  text:post.text, 
                  UserId: post.UserId,
                  Comment: post.Comment,
                  createdAt: post.createdAt,
                  fromhome : true,
                  User:{
                    name: post.User.name,
                    __typename: post.User.__typename
                  } 
                })}}>
                <Text style={{ color: "#787878" }}>{post.title}</Text>
              </TouchableOpacity>
            )
          })
        }
      </View>
    )
  }
  if(error){
    return(
      <View style={styles.card2}>
        <Text style={{ color: "#787878" }}>불러오기 실패</Text>
      </View>
    )
  }
}

function Main({navigation}){
  const [result, setResult] = useState(null);
  const openLMS = async () => {
    let result = await WebBrowser.openBrowserAsync(URI_LMS);
    setResult(result);
  };
  const openHOME = async () => {
    let result = await WebBrowser.openBrowserAsync(URI_HOME);
    setResult(result);
  };
  const openPORTAL = async () => {
    let result = await WebBrowser.openBrowserAsync(URI_PORTAL);
    setResult(result);
  };


  // 강의 정보 받기.
  const { loading, error, data } = useQuery(SEE_REGIST_LECTURE);

  //console.log("loading: ",loading);
  //console.log("data   : " , data);
  //console.log("error  : ", error );
  

  if(error){
    console.log("error  : ", error );
    return(
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1478FF" />
        <Text>{error}</Text>
      </View>
    )
  }
  if(loading){
    console.log("loading...");
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1478FF"/>
      </View>
    )    
  }
  if(data){
    // 데이터 전처리. 
    let lectures = data.seeRegistLecture;
    //console.log("length: ", lectures.length);
    let class_list = [{
      start_time: new Date(null)
    }];
    for(let i=0; i<lectures.length; i++){
      let num_of_classes = lectures[i].classes.length;
      for(let j=0; j<num_of_classes; j++){
        if(lectures[i].classes[j].VOD) continue;
        let start_time = new Date(Number(lectures[i].classes[j].startTime)+TIMEZONE);
        //console.log("timezone offset: ", start_time.getTimezoneOffset());
        let end_time = new Date(Number(lectures[i].classes[j].endTime)+TIMEZONE);
        let class_obj = {
          name: lectures[i].name,
          room: lectures[i].room,
          start_time: start_time,
          end_time: end_time,
          week: lectures[i].classes[j].week,
          vod: lectures[i].classes[j].VOD
        }
        class_list.push(class_obj);
      }
    }
    // 수업을 빠른 시간순으로 정렬 
    if(class_list.length > 1){
      class_list.sort((a,b)=>{
        return a.start_time.getTime() - b.start_time.getTime();
      })
    } 
    //console.log("HomeScreen::Main::class_list: ",class_list);

    // 현재 시간 포함 가장 가까운 수업을 찾는다.
    let current_class = 0;
    let next_class = 0;
    let now = new Date(Number(NOW));                     
    console.log("now:",now);
    for (let i=0; i<class_list.length; i++){
      if (now <= class_list[i].start_time){
        current_class = i;
        if(current_class+1 < class_list.length) next_class = i+1;
        break;
      }
    }
    console.log(now)
    console.log(class_list[current_class]);
    console.log(class_list[next_class]);
    return(
      <ScrollView style={{flex:1}}>
      <CardInfo current_class={class_list[current_class]}/>

      <Text style={{ textAlign: "left", paddingLeft: 30, fontWeight: "700", paddingTop: 10 }}>다음 일정</Text>
      
      <CardInfo2 next_class={class_list[next_class]}/>
        <Text style={{ textAlign: "left", paddingLeft: 30, fontWeight: "700", paddingTop: 10 }}>공지사항</Text>
      <Notification navigation={navigation} bid={NOTIF_BOARD_ID}/>
        <Text style={{ textAlign: "left", paddingLeft: 30, fontWeight: "700", paddingTop: 10 }}>학생회 공지사항</Text>
      <Notification navigation={navigation} bid={STU_NOTIF_BOARD_ID}/>
      <View style={{flex:1,flexDirection:"row", alignItems:"center", justifyContent:"center", marginHorizontal:20}}>
        
        <View style={styles.webview}>
          <TouchableOpacity onPress={()=>openLMS()}>
            {<Image source={require('../assets/lms_link.png')} resizeMode="stretch"/>}
            <Text style={styles.webviewText}>LMS</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.webview}>
          <TouchableOpacity onPress={()=>openHOME()}>
            {<Image source={require('../assets/home_link.png')} resizeMode="stretch"/>}
            <Text style={styles.webviewText}>학교홈</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.webview}>
          <TouchableOpacity onPress={()=>openPORTAL()}>
            {<Image source={require('../assets/portal_link.png')} resizeMode="stretch"/>}
            <Text style={styles.webviewText}>통합정보시스템</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    )
  }

}


export default function HomeScreen({navigation}) {
  console.log("HomeScreen");
  const isFocused = useIsFocused();
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: {
      Authorization: `Bearer ${userInfo.token}`
    }
  });
  /*
  useFocusEffect(React.useCallback(()=>{
    // 이곳에서 refetch
    alert('SCREEN IS FOCUSED');
    return()=>{
      alert("SCREEN WAS UNFOCUSED");
    }
  },[])
  );
  */
  if(isFocused){
    return (
      <ApolloProvider client={client}>
        <Main navigation={navigation}/>
      </ApolloProvider>
    )
  }else{
    return (
      <View></View>
    )
  }

}


const styles = StyleSheet.create({
  notificationTitle: {

  },
  notificationList: {
    flexDirection: "row",
    padding: 3,
  },
  adcard:{
    marginVertical: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  card2: {
    backgroundColor: "white",
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 25,
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 10,
    textAlign: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    margin: 25,
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 10,
    textAlign: "center",
    justifyContent: "center",
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
    flex:1,
    flexDirection:"row",
    marginHorizontal: "25%"
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview:{
    margin: 5,
    padding: 5,
    flex: 1,
    alignItems:"center",
    justifyContent: "center"
  },
  webviewText:{
    textAlign: "center",
    fontWeight: "700",
    color: "#323232"
  },
  logo:{
    width: 32,
    height: 32,
  }
});
