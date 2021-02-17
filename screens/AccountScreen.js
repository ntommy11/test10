import React from 'react';
import { AuthContext, UserContext, IdContext} from '../components/context';
import {View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Switch } from 'react-native';
import SwitchSelector from 'react-native-switch-selector';
import { SEE_REGIST_LECTURE } from '../queries';
import { ApolloClient, InMemoryCache, useQuery, ApolloProvider } from "@apollo/client";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-community/async-storage';

const ICSname = "학교생활도우미 일정";               // 내보내기 할때 사용할 캘린더 이름             
const NOW = new Date();                         // 현재 시간
const TIMEZONE = NOW.getTimezoneOffset()*60000; // DB와 타임존 싱크를 맞추기 위한 상수 

const options = [                               // "수업 n분 전 알림"을 위한 옵션
  { label: '끄기', value: 0},
  { label: '5분', value: 5 },
  { label: '10분', value: 10 },
  { label: '15분', value: 15 },
  { label: '20분', value: 20 },
  { label: '30분', value: 30 },
  { label: '60분', value: 60 },
];

// 자바스크립트의 Date를 받아서 ICS Date 형식으로 바꾸어 리턴
function convertToICSDate(dateTime) {
    const year = dateTime.getFullYear().toString();
    const month = (dateTime.getMonth() + 1) < 10 ? "0" + (dateTime.getMonth() + 1).toString() : (dateTime.getMonth() + 1).toString();
    const day = dateTime.getDate() < 10 ? "0" + dateTime.getDate().toString() : dateTime.getDate().toString();
    const hours = dateTime.getHours() < 10 ? "0" + dateTime.getHours().toString() : dateTime.getHours().toString();
    const minutes = dateTime.getMinutes() < 10 ? "0" +dateTime.getMinutes().toString() : dateTime.getMinutes().toString();

    return year + month + day + "T" + hours + minutes + "00Z";
}

// 시작,끝 시간을 받아서 하나의 ICS이벤트 형식으로 포매팅하여 리턴 
function createVEVENT(start, end, summary="", description="", location=""){
    return `BEGIN:VEVENT
DTSTART:${convertToICSDate(start)}
DTEND:${convertToICSDate(end)}
DESCRIPTION:${description}
LOCATION:${location}
SUMMARY:${summary}
END:VEVENT
`
}

// 수업 리스트를 받아서 각 수업마다 VEVENT(ICS 이벤트) 형식을 포매팅한 후 이어붙인다.
function createCAL(class_list){
  let template = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${ICSname}
X-WR-TIMEZONE:Asia/Seoul
BEGIN:VTIMEZONE
TZID:Asia/Seoul
X-LIC-LOCATION:Asia/Seoul
BEGIN:STANDARD
TZOFFSETFROM:+0900
TZOFFSETTO:+0900
TZNAME:KST
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
`;
  for(let i=0; i<class_list.length; i++){
    template += createVEVENT(class_list[i].start_time, 
                             class_list[i].end_time, 
                             class_list[i].name, 
                             class_list[i].name,
                             class_list[i].room);
  }
  template += "END:VCALENDAR"
  return template;
}





function Sub({class_list}){
  const user = React.useContext(UserContext);
  const user_meta = React.useContext(IdContext);
  const { signOut } = React.useContext(AuthContext);

  // 공지 알림 ON/OFF
  const [notif_switch, setNotifSwitch] = React.useState(true);
  console.log("notif_switch:", notif_switch);
    // 공지 알림 ON/OFF 초기값 세팅
  AsyncStorage.getItem("notif_switch",(err,res)=>{
    console.log("notif_switch res:", res);
    res=="ON"? setNotifSwitch(true):setNotifSwitch(false);
  });

  const notif_switch_handler = async()=>{
    if(notif_switch){ // 끄는 상황
      await AsyncStorage.setItem("notif_switch", "OFF");
    }
    else{
      await AsyncStorage.setItem("notif_switch", "ON");
    }
    setNotifSwitch(!notif_switch);
  }
  const exportICS = ()=>{
    let uri = FileSystem.documentDirectory + "schedule.ics"
    let file = createCAL(class_list);
    FileSystem.writeAsStringAsync(uri, file).then(()=>{
      Sharing.shareAsync(uri);
    }).catch(error=>{
      console.log(error);
    })
  }


  // 푸쉬 알림 설정 코드
  const [pushInit, setPushInit] = React.useState(null);
  AsyncStorage.getItem("pushInitIndex", (err,res)=>{
    console.log("pushInitIndex res:", res);
    setPushInit(Number(res));
  })
  
  const setNotification = async (val) =>{
    console.log("setNotification()");
    let initIndex = "0";
    switch(val){
      case 5: initIndex="1"; break;
      case 10: initIndex="2"; break;
      case 15: initIndex="3"; break;
      case 20: initIndex="4"; break;
      case 30: initIndex="5"; break;
      case 60: initIndex="6"; break;
      default: initIndex="0";
    }
    AsyncStorage.setItem("pushInitIndex", initIndex, ()=>{console.log(`pushInitIndex set: ${initIndex}`)})
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (val>0){
      for(let i=0; i<class_list.length; i++){
        if(class_list[i].start_time < NOW) continue;

        let trigger = new Date(class_list[i].start_time.getTime() - val*60*1000);

        let month = class_list[i].start_time.getMonth()+1;
        let date = class_list[i].start_time.getDate();
        let sH = class_list[i].start_time.getHours();
        let sM = class_list[i].start_time.getMinutes();
        let eH = class_list[i].end_time.getHours();
        let eM = class_list[i].end_time.getMinutes();
        let start_time= `${sH>=10?sH:`0${sH}`}:${sM>=10?sM:`0${sM}`}`;
        let end_time= `${eH>=10?eH:`0${eH}`}:${eM>=10?eM:`0${eM}`}`;
        let id = await Notifications.scheduleNotificationAsync({
          content:{
            title: '수업 알림!',
            body: `${val}분 뒤에 ${class_list[i].name}(${class_list[i].room}) ${month}/${date} ${start_time}~${end_time}수업이 있습니다.`,
            sound: 'default'
          },
          trigger,
        })
      }
    }
  }

  return(
      <View>
          <View style={styles.card}>
              <View style={styles.item}>
                <Text style={styles.title}>계정: {user.email}</Text>
              </View>
              <View style={styles.item}> 
                <Text style={styles.title}>등급: {user_meta.grade}</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.title}>푸쉬 알림 설정</Text> 
                <TouchableOpacity style={{marginVertical: 5}} onPress={()=>user_meta.grade>1?Alert.alert("학생회비 납부자 전용 기능입니다"):null}>
                  {
                    pushInit != null? 
                    <SwitchSelector 
                      disabled={user_meta.grade>1?true:false}
                      options={options} 
                      initial={pushInit}
                      backgroundColor="#eeeeee"
                      buttonColor="#1478FF"
                      fontSize={15}
                      onPress={val=>{
                        if(user_meta.grade<2){
                          setNotification(val)                         
                        }
                        else{
                          Alert.alert("학생회비 납부자 전용 기능입니다")
                          return 0;
                        }
                      }
                      }  
                    />
                    :
                    null
                  }
                </TouchableOpacity>
              </View>
              {
              <View style={styles.item}>
                <View style={{flexDirection:"row", justifyContent:"space-between"}}>
                  <Text style={styles.title}>공지 알림 설정</Text>
                  <View style={{justifyContent:"flex-end", marginBottom:5}}>
                    <Switch 
                      value={notif_switch}
                      onValueChange={()=>notif_switch_handler()}
                    />
                  </View>  
                </View>

              </View>
              }   
          </View>
          <View style={{alignItems:"center", justifyContent:"center"}}>
              <TouchableOpacity style={styles.button} onPress={()=>exportICS()}>
                <Text style={{fontSize:20, color:"white"}}>일정 내보내기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={()=>signOut()}>
                <Text style={{fontSize:20, color:"white"}}>로그아웃</Text>
              </TouchableOpacity>
          </View>

      </View>
    
  )
}



function Main(){
  const { loading, error, data } = useQuery(SEE_REGIST_LECTURE);

  //console.log("loading: ",loading);
  //console.log("data   : " , data);
  //console.log("error  : ", error );

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
    console.log("length: ", lectures.length);
    let class_list = [];
    for(let i=0; i<lectures.length; i++){
      let num_of_classes = lectures[i].classes.length;
      for(let j=0; j<num_of_classes; j++){
        if (lectures[i].classes[j].VOD) continue;
        let start_time = new Date(Number(lectures[i].classes[j].startTime)+TIMEZONE);
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
    class_list.sort((a,b)=>{
      return a.start_time.getTime() - b.start_time.getTime();
    })
    //console.log(class_list);
    return (
      <Sub class_list = {class_list} />
    );
  }
}

export default function AccountScreen(){
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: {
      Authorization: `Bearer ${userInfo.token}`
    }
  });
/*
  FileSystem.downloadAsync(
    'http://techslides.com/demos/sample-videos/small.mp4',
    FileSystem.documentDirectory + 'small.mp4'
  )
    .then(({ uri }) => {
      console.log('Finished downloading to ', uri);
      Sharing.shareAsync(uri);
    })
    .catch(error => {
      console.error(error);
    });
*/
  return (
    <ApolloProvider client={client}>
      <Main/>
    </ApolloProvider>
  )
}
  

  const styles = StyleSheet.create({
    classboxText:{
      textAlign: "center",
      fontSize: 11,
    },
    classboxTextsmall:{
      textAlign: "center",
      fontSize: 6,
    },
    classbox:{
      paddingVertical: 3,
      justifyContent: "center",
      borderStyle: "dashed",
      borderWidth: 1,
      flex: 1
    },
    classbox2:{
      justifyContent: "center",
      borderStyle: "dashed",
      borderWidth: 1,
      flex: 1
    },
    weeklyHeader: {
      backgroundColor: "white",
      flexDirection: 'row',
      borderStyle: "dashed",
      borderWidth: 1,
    },
    weeklyHeaderBox: {
      padding: 9,
      flex: 1
    },
    weeklyHeaderText: {
      textAlign: "center",
      fontWeight: "700"
    },
    scrollView: {
      height: 200
    },
    card2: {
      marginVertical: 5,
      marginHorizontal: 25,
      borderWidth: 1,
      borderColor: "#dcdcdc",
      borderRadius: 10,
      height: "40%"
    },
    card: {
      backgroundColor: "white",
      marginVertical: 25,
      marginHorizontal: 25,
      borderWidth: 1,
      borderColor: "#dcdcdc",
      borderRadius: 10,
      padding: 10
    },
    date: {
      margin: 5,
      color: "blue",
      fontSize: 15,
      borderColor: "black",
      textAlign: "center",
    },
    time: {
      margin: 5,
      fontWeight: "600",
      fontSize: 20,
      textAlign: "center",
    },
    title: {
      fontSize: 17,
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
    },
    button: {
      alignItems: 'center',
      marginVertical: 10,
      marginHorizontal: 10,
      borderStyle:"dashed", 
      borderWidth:1,
      padding:10,
      width: "80%",
      borderRadius: 10,
      backgroundColor: "#1478FF",
      borderColor: "white"
  },
    item:{
      marginVertical: 10,
      marginHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#eeeeee",
    }
  });