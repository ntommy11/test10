import React, { useState, useEffect, useContext,useRef, useCallback,Fragment, useReducer } from 'react';
import { AppRegistry } from 'react-native';
import { StyleSheet, Text, View, Button,ScrollView,TouchableOpacity, Image,
  RefreshControl,TextInput,Alert,FlatList,KeyboardAvoidingView,Dimensions } from 'react-native';
import {colors, Header} from 'react-native-elements';
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery,useLazyQuery , createHttpLink, useMutation} from "@apollo/client";
import Modal from 'react-native-modal'

import { GET_CONTINENTS, GET_CONTINENT, SEE_REGIST_LECTURE, GET_USERID } from "../queries";
import { Appbar } from 'react-native-paper';
import { createNavigatorFactory, NavigationContainer, useNavigationBuilder } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator,HeaderBackButton } from '@react-navigation/stack';

import { Ionicons, FontAwesome, AntDesign,Entypo,Feather,MaterialCommunityIcons  } from '@expo/vector-icons';
import { AuthContext, UserContext,IdContext, MemoContext } from '../components/context';
import AsyncStorage from '@react-native-community/async-storage';
 
import HomeScreen from './HomeScreen'; 
import ScheduleScreen from './ScheduleScreen';
import {SEE_ALL_POSTERS,POST_VIEW,POST_UPLOAD,POST_DELETE,POST_LOAD,COMMENT_UPLOAD,COMMENT_DELETE,POST_INFO}from '../queries'
import { valueFromAST } from 'graphql';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { ScreenStackHeaderLeftView } from 'react-native-screens';
import HyperlinkedText from 'react-native-hyperlinked-text'
//import { FlatList } from 'react-native-gesture-handler';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import { setStatusBarNetworkActivityIndicatorVisible } from 'expo-status-bar';
import { set } from 'react-native-reanimated';

import { useIsFocused } from '@react-navigation/native'

var KeepData = null;
var SizeList = [[],[]];
var allSize =[0,0];
const titleLen = 100;
const textLen = 1000;
const checkLen = 500;
function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, [])
  return update;
}

const MemoPrint = React.memo(({memo,num,index,navigation}) =>{
  console.log("memoprint실행")
  var short;
  
  if(memo.checklist.length > 10) short = true;
  else short = false;
  
return( 
<TouchableOpacity  
  style={styles.card}
  onPress= {()=>{
    checklist=memo.checklist.slice(); 
    console.log("????",checklist);   
    navigation.navigate("keepUpload",{mode:index, num:num, 
    initText:memo.text, initTitle:memo.title, initButton : false
    
  })
  }}
  onLayout={(event) => {
     var {_,_,_,height} = event.nativeEvent.layout;
    console.log("높이재는중", SizeList[num].length, index)

    if(SizeList[num].length == index){//초기화
      //console.log("뭔가이상해");
      SizeList[num].push(height);
      //console.log("I GOT IT",SizeList);
      allSize[num]+=height;
      console.log(allSize)
    }

    if(SizeList[num][index] !== height){ //변경
      allSize[num] -= SizeList[num][index];
      SizeList[num][index] = height
      allSize[num] += height;
    }//size가 다른 경우
  }}
   >

    <Text numberOfLines={2} style={{fontSize:20}}>{memo.title}</Text>
    <Text numberOfLines={3}>{memo.text}</Text>
        {short?
        <View >
          {memo.checklist.slice(0,11).map((check)=><CheckPrint check={check} key={check.id}/>)}
          <Text>...</Text>
        </View>
        :
        <View>
        {memo.checklist.map((check)=><CheckPrint check={check} key={check.id}/>)}
        </View>
        }
    </TouchableOpacity> 

);
});
  
const CheckPrint = React.memo(({check})=>{

  return ( 

 
    <View style={{flexDirection:'row'}}> 
        {check.toggle ?  
        <Feather name="check-circle" size={15} color="gray" /> : <Entypo name="circle" size={15} color="black" />
        }
        {check.toggle?
         <Text style={{textDecorationLine:'line-through',color : 'gray',width:'90%' }} numberOfLines={2} >{check.text}</Text> 
         :
         <Text style={{width:'90%'}}numberOfLines={2}>{check.text}</Text>
        }
    </View>

  )

});

export const KeepScreen = ({navigation})=>{
  const update = useForceUpdate();
  console.log("keepscreen")
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
  })
  const isFocused = useIsFocused();

  return(

    isFocused ?
  <ApolloProvider client = {client}>
  <KeepContent navigation={navigation} reload={update}/> 

  </ApolloProvider>
  :
  <View></View>
   );

}
   
var refresh = false;
var forsize = false;
export const KeepContent = ({reload,navigation}) => {
  const update = useForceUpdate();
  console.log("KeepContent!!1:",KeepData)
  console.log("응?",SizeList)


  const writeData = useCallback (async () =>{ //데이터 쓰기
    try {
      await AsyncStorage.setItem('MEMO', JSON.stringify(KeepData));
    } catch (e) {
      console.log(e)
    }
  });

  const changeKeepData = useCallback(()=>{
    
    var dif = allSize[0] - allSize[1]

    while(true){
      var counter;
      var num;
      var min = 10000;
      var index = -1;
      if(dif>0){
        counter =1;
        num = 0;
      }
      else{ 
        dif=-dif
        num = 1;
        counter = 0; 
      }
      console.log("dif allsize------------",dif,allSize,SizeList)
      console.log("allsize -----------------",allSize)
      console.log("sizelist -----------------",SizeList)
      for(var i = 0; i<SizeList[num].length ;i++){
        var willMove = Math.abs(dif - 2*SizeList[num][i])
        if(dif<=willMove) continue;
        if(willMove < min){
          index = i;
          min = willMove;
        }  
      }
      console.log(index); 
      if(index == -1) break; //이동할 변수 결정 x
      else{
        var i; 
        console.log("바꾸기는하니??")
      dif -= 2*SizeList[num][index]
      allSize[num] -= SizeList[num][index];
      allSize[counter] += SizeList[num][index];
      

      for(i=0; i<KeepData[counter].length ;i++)
        if(KeepData[counter][i].id > KeepData[num][index].id){
        KeepData[counter].splice(i,0,KeepData[num][index]);
        SizeList[counter].splice(i,0,SizeList[num][index]);
        break;
      } 
      
      if(i == KeepData[counter].length || KeepData[counter].length == 0){
        console.log("이상한움직임")
        KeepData[counter].push(KeepData[num][index]);
        SizeList[counter].push(SizeList[num][index]);
        
      }
 
       
      KeepData[num].splice(index,1);
      SizeList[num].splice(index,1);
    
      }
    }  
    
    writeData();
   
  });

  const readData = useCallback(async () => {
    try { 
      const userMemo = await AsyncStorage.getItem("MEMO")
  
      if (userMemo !== null) {
        console.log("저장소에 먼가 있음")
        KeepData = JSON.parse(userMemo)
        update();
      }
      else{
        console.log("저장소에 먼가 없음")
        KeepData = [[],[]];
      }
    } catch (e) {
      alert('Failed to fetch the data from storage') 
    }
  });

 
  useEffect(()=>{
    console.log("useffect실행!!")
    if(KeepData == null){
      //console.log("야되냐?")
      readData();
    
    }
  },[]);
 
  

  //console.log("HERE WE GO",storeMemo);
  return ( 
    <View style={{flex:1}} >
      { KeepData == null?
      (null)
      :  
        <ScrollView contentContainerStyle={{flexDirection: 'row', flexWrap: 'wrap'}}>
        <View style={{width:'50%'}}>
          {KeepData[0].map((memo,index)=><MemoPrint num={0} memo={memo} 
          navigation={navigation} key={memo.id} index={index}/>)}
          </View>

          <View style={{width:'50%'}}>
          {KeepData[1].map((memo,index)=><MemoPrint num={1} memo={memo} 
          navigation={navigation} key={memo.id} index={index}/>)}
          </View> 
          </ScrollView>       
      }
      <View style={{borderWidth:1,position:'absolute',bottom:10,alignSelf:'center'}}>
        <Button title="메모작성" onPress={()=>{
          checklist=[]
          navigation.navigate("keepUpload",{mode:"write", initText:"", initTitle:"", num:2,initButton : false})}}/>
        </View> 
      <View onLayout={()=>{
        console.log("여기임")
        if(refresh){
          refresh = false;
        changeKeepData();
         update();
      
         }}}></View>
    </View> 
  );
}
 


var checklist = []

export const KeepUpload = ({route,navigation}) => {
  console.log("KeepUpload!!!!",route);
  //console.log(checklist)
  const [title,setTitle] = useState(route.params.initTitle);
  const [text, setText] = useState(route.params.initText);
  const [preventUp, setPreventUp] = useState(route.params.initButton); //일단 업로드만실험해볼것.
  const [preventDel, setPreventDel] = useState(route.params.initButton);
  const update = useForceUpdate();
  ///console.log("prevent!!!",prevent)

  React.useEffect(()=>{
    console.log("upload useeffect!!")
    if(preventUp){
      if((KeepData[0].length + KeepData[1].length) >= 100) Alert.alert("","메모가 너무 많습니다. 더 이상 메모를 만들 수 없습니다.")
      else{
        if(route.params.mode == "write"){
          var today = new Date().getTime();
          KeepData[0].push({id:today, title:title, text:text, checklist : checklist});

        }
        else{
          KeepData[route.params.num][route.params.mode].title = title;
          KeepData[route.params.num][route.params.mode].text = text;
          KeepData[route.params.num][route.params.mode].checklist = checklist;
          }
      } 
      checklist = [];
    // route.params.keep({refresh:true})
      refresh = true;
      navigation.goBack();
    }

    if(preventDel){
      //console.log("삭제");
      allSize[route.params.num] -=SizeList[route.params.num][route.params.mode]
      KeepData[route.params.num].splice(route.params.mode,1)
      SizeList[route.params.num].splice(route.params.mode,1)
      checklist=[];
      //route.params.keep({refresh:true})
      refresh = true;
      navigation.goBack(); 

    }
  },[preventUp,preventDel])

  return( 
  <Fragment >
  <KeyboardAwareScrollView>

  <View style={{flex:1 ,marginTop:40, marginHorizontal:10 ,flexDirection:'row',justifyContent:'space-between'}}>
    <View style = {{flexDirection: 'row'}}>
    <TouchableOpacity  style={{alignSelf:'center'}}
    onPress= {()=>{ 
      checklist = [];
      //console.log("뒤로가기 ㅜㄴ럴ㅆ다고", checklist)
     // route.params.keep({refresh:false})
       navigation.goBack()}}
     > 
       <AntDesign name="closecircle" size={30} color="dodgerblue" />
     </TouchableOpacity>
  <Text style={{fontSize:25, marginLeft:10}}>메모작성</Text>
  </View>
    <View style={{flexDirection:'row'}}>
    { route.params.mode != "write"?
    <View style={{marginHorizontal:10}}>
    <Button 
    title="삭제"
    disabled ={preventDel}
    onPress={() =>{
      if(!preventDel) setPreventDel(true)
    }} />
    </View> 
    : 
    (null)
    }
    <Button title="저장"  
    disabled={preventUp}
    onPress={() =>{ //checklist추가예정.
      if(!preventUp) setPreventUp(true)  
    }} />
    </View>
  </View > 
  <View style={{margin:10}}>
  <TextInput 
        style={{
          textAlignVertical: "top",
          fontSize : 20
        }}
    placeholder="제목"
    autoCapitalize="none"
    onChangeText={(val)=>setTitle(val)}
    value={title}
    maxLength={titleLen}
     />
   </View>  
   <View style={{marginHorizontal:10, marginTop:10}}>
  <TextInput 
        style={{
          textAlignVertical: "top",
          fontSize : 20
        }}
    placeholder="내용"
    autoCapitalize="none"
    onChangeText={(val)=>setText(val)}
    multiline={true}
    blurOnSubmit={true}
    numberOfLines={2}
    maxLength={textLen}
    value={text}
     />
  </View> 
  <View style={{marginHorizontal:10,marginTop:10}} >
    {checklist.map((memo,index)=>(<ListItem index={index} reload={update} key={memo.id}/>))}
  </View>
 
</KeyboardAwareScrollView>
  <View style={{justifyContent:'flex-end',margin:10}}>
  <KeyboardAvoidingView 
   behavior="position">
    <TouchableOpacity  
    onPress= {()=>{
       var today = new Date().getTime();
      if(checklist.length >= 50)Alert.alert("","체크리스트가 너무 많습니다. 더 이상 체크리스트를 만들 수 없습니다.")
      else{
      checklist.push({id:today,text:"",toggle:false}) 
       update();
      }
      }}
     >
       <AntDesign name="plussquareo" size={30} color="black" />
     </TouchableOpacity>
  </KeyboardAvoidingView>
  </View>
  </Fragment>
  );
}
   
const ListItem = React.memo(({index,reload}) =>{ //나중에 매개변수받아야함.
  console.log("ListItem",index)
  console.log(checklist)
  const [toggle, setToggle] = useState(checklist[index].toggle) 
  const [text, setText] = useState(checklist[index].text)
 
   
  return(

  <View style={{flexDirection:'row',marginTop:10}}> 
  <View style={{flexDirection:'row', flex:1}}>
  <TouchableOpacity onPress={()=>{ 
        if(toggle){
          checklist[index].toggle = false;
          setToggle(false)}
        else{
          checklist[index].toggle = true;
          setToggle(true)}}}>
  {toggle ?
  <Feather name="check-circle" size={24} color="gray" />
  :
  <Entypo name="circle" size={24} color="black" />
  } 
  </TouchableOpacity>
  {toggle ? 
  
  <Text style={{textDecorationLine:'line-through',color : 'gray',fontSize:20, width:'90%' }}>{text}</Text>
  : 
  <TextInput 
  style={{fontSize:20}}
  placeholder="내용을 입력하세요."
  multiline
  blurOnSubmit={true}
  value={text} 
  onChangeText={(val)=>{
    checklist[index].text = val;
    setText(val)
  }}
  /> 
  }    
  </View>
  <View style={{width:'7%'}} >
  {toggle ?
   <TouchableOpacity onPress={()=>{
    checklist.splice(index,1);
    reload();
     }}
     >
    <AntDesign name="close" size={24} color="black" />
   </TouchableOpacity> 
   :
   (null)
  }
  </View>
  </View>

  );
  
})

  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start' // if you want to fill rows left to right
  },
  item: { 
    width: '50%', // is 50% of container width 
  },
  card: { 
    backgroundColor: "white",
    padding: 10, 
    margin: 1,
    borderWidth: 1, 
    borderColor: "#dcdcdc",
    borderRadius: 5,
    textAlign: "center",
    justifyContent: "center",
  },
})