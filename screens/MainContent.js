import React, { useState, useEffect, useContext,useRef, useCallback,Fragment } from 'react';
import { AppRegistry } from 'react-native';
import { StyleSheet, Text, View, Button,ScrollView,TouchableOpacity, Image,
  RefreshControl,TextInput,Alert,FlatList,KeyboardAvoidingView,ActivityIndicator } from 'react-native';
import {colors, Header} from 'react-native-elements';
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery,useLazyQuery , createHttpLink, useMutation} from "@apollo/client";
import Modal from 'react-native-modal'

import { Appbar } from 'react-native-paper';
import { createNavigatorFactory, NavigationContainer, useNavigationBuilder } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator,HeaderBackButton } from '@react-navigation/stack';

import { Ionicons, FontAwesome, AntDesign  } from '@expo/vector-icons';
import { AuthContext, UserContext,IdContext } from '../components/context';
import AsyncStorage from '@react-native-community/async-storage';

import HomeScreen from './HomeScreen'; 
import ScheduleScreen from './ScheduleScreen';
import {SEE_ALL_POSTERS,POST_VIEW,POST_UPLOAD,POST_DELETE,
  POST_LOAD,COMMENT_UPLOAD,COMMENT_DELETE,POST_INFO,COMMENT_NAME}from '../queries'
  
import { valueFromAST } from 'graphql';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScreenStackHeaderLeftView } from 'react-native-screens';
import HyperlinkedText from 'react-native-hyperlinked-text'
//import { FlatList } from 'react-native-gesture-handler';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import { setStatusBarNetworkActivityIndicatorVisible } from 'expo-status-bar';
import { set } from 'react-native-reanimated';
import {
  AdMobBanner,
  AdMobInterstitial,
  PublisherBanner,
  AdMobRewarded,
  setTestDeviceIDAsync,
} from 'expo-ads-admob';

const adUnitID_ios = "ca-app-pub-8233357974153609/3291102463";
const adUnitID_android =  "ca-app-pub-8233357974153609/8459668669";

var Bid//보드 아이디
var Uid// 유저 정보(id, grade)
var tnum = 40//게시글/댓글 불러오는 수
var type
var allComment
var allContent
const titleLen = 100;
const textLen = 4000;
const commentLen = 1000;
var Datalist
var snum
const NOW = new Date();
const TIMEZONE = NOW.getTimezoneOffset()*60;
var printsnum = 0;
export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, [])
  return update;
}

const wait = (timeout) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

const check = (id) =>{//삭제버튼 띄우는 조건
  //console.log("check!!!!!!!!", id, Uid) 
  if(Uid == undefined) return false;
  if(Uid.id == id || ((type == 1|| type==2) && Uid.grade == 0 ) ) return true;
  else return false;
}

const UploadPostButton = ({navigation})=>{ //업로드버튼
  return (
  <Button
    title="글쓰기"
    accessibilityLabel="글쓰기"
    onPress={()=>{navigation.navigate("Upload")}}
    /> 
);} 
    
const CustomMenu = (props) => { //메뉴 버튼
  //console.log("메뉴",props.route);
  let _menu = null;
  const [isModalVisible, setModalVisible] = useState(false)
  return (
    <View style={props.menustyle}>
              <Modal isVisible={isModalVisible}>
        <TouchableOpacity style={styles.card} onPress={()=>{tnum =2 ; setModalVisible(false);props.navigation.navigate("Community",{needquery:true})}}>
        <Text style={{alignSelf: 'center'}}>2(test용)</Text>
        </TouchableOpacity> 
        <TouchableOpacity style={styles.card} onPress={()=>{tnum =20 ; setModalVisible(false);props.navigation.navigate("Community",{needquery:true})}}>
        <Text style={{alignSelf: 'center'}} >20</Text>  
        </TouchableOpacity> 
        <TouchableOpacity style={styles.card} onPress={()=>{tnum =40 ; setModalVisible(false);props.navigation.navigate("Community",{needquery:true})}}>
        <Text style={{alignSelf: 'center'}}>40(기본값)</Text>
        </TouchableOpacity> 
        <TouchableOpacity style={styles.card} onPress={()=>{setModalVisible(false);}}>
        <Text style={{alignSelf: 'center'}}>취소</Text>
        </TouchableOpacity> 
        </Modal>
      <Menu
        ref={(ref) => (_menu = ref)}
        button={
          
            <TouchableOpacity onPress={() => _menu.show()}>
              <Ionicons name="menu" size={30}/>
            </TouchableOpacity>
        }>
        <MenuItem onPress={() => {
          setModalVisible(true);
        }}>글 설정</MenuItem>
        
      </Menu>
    </View>

  );
};



const Test = React.memo(({post,navigation})=>{
  //console.log("jhhuhuih",post.item.id);
  const time = new Date(Number(post.item.createdAt)+TIMEZONE);
  //console.log(time.getDate());
  return(
    post.item.delete ? (null) : 
    <TouchableOpacity  
    style={styles.card}
    onPress= {()=>{navigation.navigate("Post",{...post.item, num:post.index,fromhome: false})}}
     >

    <View style={{flexDirection: 'row',justifyContent:'space-between'}}>

    <View style={{flexDirection: 'row'}}>
    <Image style={{
      width : 30,
      height: 30,
      margin: 5,
    resizeMode: 'contain'
  }}
  source={require('../assets/igmyeong.png')} />
  {type == 1 ?
    <Text style={{fontSize: 15}}>익명</Text>:<Text style={{fontSize:15}}>{post.item.User.name}</Text> 
  }
    </View>
    <Text style={{fontSize: 10}}> {time.getMonth()+1}/{time.getDate()}/{time.getHours()}:{time.getMinutes()}</Text>
    </View>
    <Text style={{fontSize : 20}} numberOfLines={1}>{post.item.title}</Text>
    <Text style={{fontSize : 13}} numberOfLines={3}>{post.item.text}</Text>
    <View style={{alignItems:'flex-end'}}>
    <View style={{flexDirection:'row',marginTop:5}}>
      <FontAwesome name="comment-o" size={10} color='blue' />
      <Text style={{fontSize:10,marginLeft:10}}>{post.item.Comment.length}</Text>
      </View>
    </View>
</TouchableOpacity>

  ); 

});
 

var refreshing = false
function GetAllPost({route,navigation}){
   
  console.log("GetAllPost진입@@@@@@@@@@@@@@")
  console.log("@@@@",Datalist)
  //var scroll = 0; 
  //if(!route.params.needquery) scroll = Datalist.scroll;
  //const scrollViewRef= React.useRef()
  //console.log("@@@@@@@@@@@",Datalist.Array);
  console.log(data)
  const [ 
    fetch, 
    { loading, data }
  ] = useLazyQuery(POST_LOAD,{
    variables: {bid: Bid, snum: snum, tnum: tnum}
});

  if(data!=undefined){
    //console.log("@@@@@fetchnew!!!!!!")
    for(var i=0; i<data.loadPost.length; i++)
      Datalist.Array.push(data.loadPost[i]);
      snum+=tnum ;
    //console.log(Datalist.Array.length)
  }

  const onRefresh = () => {
    refreshing = true;
    wait(10).then(() =>{ refreshing = false;
        navigation.navigate("Community",{needquery: true})});
  }

  return(  
    <View style={{flex:1}}> 
      <FlatList
      keyExtractor={(post) => post.id.toString()}
      data = {Datalist.Array} 
      renderItem ={(post)=>{ 
        //console.log("어슈발뭐지??",post);
          return (
            post == null? (null) : <Test post={post} navigation={navigation}/>
        );
          }}
      windowSize = {2}
 
      onEndReached={()=>{//console.log("끝!!"); 

            if(data == undefined) fetch()
            else{
              if(data.loadPost.length != 0 ) fetch();
            }
            }}
 
      onEndReachedThreshold={0.1}
      ListFooterComponent={
        Datalist.Array.length != 0 ?
                data == undefined?
                <ActivityIndicator color="#1478FF"/>
              :
              data.loadPost.length == 0? 
                (null) :<ActivityIndicator color="#1478FF"/> 
        :<Text>아직 등록된 글이 없습니다.</Text>
      
    }
    bounces ={false}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh ={onRefresh}/>}
      />
      <View style={{borderWidth:1,position:'absolute',bottom:10,alignSelf:'center'}}>
      {type == 0 ?
      Uid.grade == 0 ? <UploadPostButton navigation={navigation}/> : (null)
      : 
      <UploadPostButton navigation={navigation}/>
    }
      </View>
      </View>
  );
  
}



const IinitialPost =({navigation})=>{
  
  //console.log("@@@@@@@@@inital")
  const {loading, error, data} = useQuery(POST_LOAD,{
    variables: {bid: Bid, snum: 0, tnum: tnum}
  });
  if(loading)return <ActivityIndicator color="#1478FF"/>
  if(error)return <Text>에러!!</Text>

  for(var i=0; i<data.loadPost.length; i++)
  Datalist.Array.push(data.loadPost[i])
  snum += tnum;
   
  return (
    <GetAllPost  navigation={navigation} />
  );

}
  
 
export function Community({route, navigation}){
 // console.log("Commnufdisufdfs",route);
 //if(route.params.fromhome) 
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: { 
       Authorization: `Bearer ${userInfo.token}`
      },
  })
  const Id =useContext(IdContext)
  Uid = Id
  Bid = route.params.id
  allComment = null;
  allContent = null;
  type = route.params.type
  if(route.params.needquery){ 
    snum = 0;
    Datalist = {Array:[], scroll:0};
  }
   
  React.useLayoutEffect(() => {
    navigation.setOptions({
 
      headerRight: () => { //새로고침 버튼
        return (
          <View style ={{flexDirection:'row'}}>
    <TouchableOpacity  style={{alignSelf:'center',marginHorizontal:10}}
    onPress= {()=>{  printsnum = 0;
       navigation.navigate("Community",{id:route.params.id, name:route.params.name,needquery: true})}}
     >
       <FontAwesome name="refresh" size={24} color="black" />
     </TouchableOpacity>
            <CustomMenu
              menutext="Menu"
              menustyle={{marginHorizontal: 14}}
              textStyle={{color: 'white'}}
              navigation={navigation}
              route={{id:route.params.id, name:route.params.name}}
              navigation={navigation}
            />
            </View>
          ) 
        },  
      headerTitle: ()=>(<Text style ={{fontSize:20}}>{route.params.name}</Text>) //커뮤니티 타이틀바꾸기
      
   }); 
     }, [navigation,route]);


     //잠깐 수정 0131
  return(
  <ApolloProvider client = {client}>
    {Uid.grade == 2 || Uid.grade == 3 ?
       <AdMobBanner
   style={styles.adcard}
   adUnitID={adUnitID_android} // Test ID, Replace with your-admob-unit-id
   servePersonalizedAds // true or false
  onDidFailToReceiveAdWithError={this.bannerError} 
    /> : (null)}
    {route.params.needquery ?
    <IinitialPost navigation={navigation} /> : <GetAllPost navigation={navigation}/>
  }
  </ApolloProvider>
   );
  
}
 
export function Post({route,navigation}){
  //console.log("------------Post----",route);
    const userInfo = React.useContext(UserContext);
    if(route.params.fromhome) type = 0;
    const client = new ApolloClient({
      uri: "http://52.251.50.212:4000/",
      cache: new InMemoryCache(),
      headers: { 
         Authorization: `Bearer ${userInfo.token}`
        },
    })
    printsnum = 0;
    React.useLayoutEffect(() => {
      navigation.setOptions({
   
        headerTitle: ()=>{} //커뮤니티 타이틀바꾸기
        
     }); 
       }, [navigation,route]);
    return(
      <ApolloProvider client = {client}>
        <ViewPost route ={{...route}} navigation={navigation} />
    </ApolloProvider>    

      
  );
   
  }
     
   
var disable = false;
const SetHeader = ({route,navigation,deletePost})=>{ //새로고침,삭제 헤더버튼 추가.
  console.log("hedear----------------------");

   
  React.useLayoutEffect(() => {
    console.log("header layouteffect-------------------")
    navigation.setOptions({ 

      headerRight: () => {
   
        return (
        <View style={{flexDirection:'row'}} >
    <TouchableOpacity  style={{alignSelf:'center',marginHorizontal:10}}
    onPress= {()=>{  printsnum = 0;
      navigation.navigate("Post", {upload:true})}}
     >
       <FontAwesome name="refresh" size={24} color="black" />
     </TouchableOpacity>
            <View style={{marginHorizontal:10}}>
          {check(route.userId) ? 
          (<Button title="삭제" onPress={()=>{
            printsnum = 0;
            Alert.alert(
            "글을 삭제하시겠습니까?",
            "",
            [
              {
                text: "예",
                onPress: () => {
                  printsnum = 0;
                  deletePost(route.id);

                  if(route.fromhome) navigation.goBack();
                  else{
                    Datalist.Array[route.num] = {id:route.id, delete: true}; 
                    navigation.navigate("Community",{id:Bid,needquery:false})}
                
                },
                style: "cancel"
              },
              { text: "아니오", onPress: () => {return;} }
            ],
            { cancelable: true }
          );} }/>)

          :

          (null)
          }
          </View>
          </View>)}, 
 
       headerLeft :()=>{//console.log("정신나갈거같에정시난갈거같에정신",route.upload)
  
       if(route.fromhome) return (<HeaderBackButton onPress={()=>{printsnum = 0;navigation.goBack()}} />);
       return (route.upload == true) ?
            (<HeaderBackButton onPress={()=>{printsnum = 0;navigation.navigate("Community",{needquery: false})}}/>) 
                    :(<HeaderBackButton onPress={()=>{
                      console.log("해더버튼printsnunm초기화전")
                      printsnum = 0;
                      console.log("초기화 후")
                      navigation.goBack()
                      }} />)
                  }
      
   } );  
     }, [navigation,route,disable]);


     if(disable) setTimeout(()=>{forceupdate()},1000)
     
     return ((null));

}
    

function ViewPost({route,navigation}){//한 Post 다 출력
  console.log("----------viewpoint rotue-------------",route)
  const cond = (route.params.upload == true) 
  const [deletePostMutation] = useMutation(POST_DELETE);
  const deletePost = React.useCallback(async(pid) =>{
      try{
      const data = await deletePostMutation({
        variables: {
          pid: pid
        }
      }
    )} 
    catch(e){
      console.log(e); 
      }
  } );
  const [uploadMutation] = useMutation(COMMENT_UPLOAD);//
  const uploadComment = React.useCallback(async(pid,text) =>{
      try{
      const data = await uploadMutation({
        variables: {
          pid: pid,
          text: text
        }
      }
    );
  }
    catch(e){
      console.log(e); 
      }
  } );

  const [deleteCommentMutatin] = useMutation(COMMENT_DELETE);
  const deleteComment = React.useCallback(async(cid) =>{
    try{
    const data = await deleteCommentMutatin({
      variables: {
        cid: cid
      }
    }
  );
} 
  catch(e){
    console.log(e); 
    }
}  );
  


if(!cond ){
allContent = [{id:route.params.id, UserId: route.params.UserId, 
              createdAt: route.params.createdAt, text:route.params.text,
              title:route.params.title, num:route.params.num,
              commentLen:route.params.Comment.length,
              User: route.params.User ,
              __typename:"Post"}];
allComment = route.params.Comment;
}



  return(
   
      <View style={{flex:1}}>
        <SetHeader route={{id: route.params.id , upload: route.params.upload, 
        userId: route.params.UserId, num:route.params.num, 
        fromhome: route.params.fromhome}}
       navigation={navigation} deletePost={deletePost}/>
      {cond?
      <CommentReload route ={{id: route.params.id, userId: route.params.UserId, 
        text:route.params.text, title:route.params.title,
        createdAt : route.params.createdAt, num: route.params.num, fromhome: route.params.fromhome,
        user : route.params.User
      }}
       deleteComment={deleteComment} navigation ={navigation}/>
      :
        type == 1?
        <PrintAllContent deleteComment={deleteComment} navigation={navigation}/>
        :
        <CommentReload route ={{id: route.params.id, userId: route.params.UserId, 
          text:route.params.text, title:route.params.title,
          createdAt : route.params.createdAt, num: route.params.num, fromhome: route.params.fromhome,
          user : route.params.User
        }}
        deleteComment={deleteComment} navigation ={navigation}/>
        }   

    <View style={{justifyContent:'flex-end',margin:10}}>
    <KeyboardAvoidingView 
     behavior="position">
       <CommentInput  route={{id: route.params.id, upload: route.params.upload, prevent:false}} upload = {uploadComment} navigation ={navigation}/>
     
    </KeyboardAvoidingView>
    </View>
    
  </View>);
}  
     
//<CommentInput  route={{id: route.params.id}} upload = {uploadComment} navigation ={navigation}/>
const PrintAllContent = ({deleteComment,navigation}) =>{
 
  if(allComment == undefined || allContent == undefined) return (null);
  console.log("print!!!!!!!!!!!", allComment.length, printsnum);
  //console.log("beforeallcontent!!!!!!!",allContent.length,"printsum",printsnum)
  const forceupdate = useForceUpdate();
  var end = false;
  var i = 0;
  for(;i<tnum ;i++){
  if(allComment[printsnum+i] == undefined){end=true; break;}
    allContent.push(allComment[i+printsnum]);
  } 
  if(!end)printsnum+=i;
  //console.log("print!!!!!!!!!!!", allContent.length);
  return(
    <Fragment>
    <FlatList
    data = {allContent}
    keyExtractor={(post)=>post.createdAt.toString()} 
    renderItem={(post)=>{
      //console.log("가자아아아",post)
      return(
      post.item.__typename == "Post"?
      <PostStyle post={post}/> : <CommentContent route={post} deleteComment={deleteComment} navigation={navigation}/>);}
 
    } 
    onEndReached={()=>{
      //console.log("끝!")
        if(!end){
        //console.log("nono")
         forceupdate(); 
        }}}
    onEndReachedThreshold={0.1}
    ListFooterComponent={!end ?<ActivityIndicator color="#1478FF"/>:(null)}
    /> 
    </Fragment>
  );

}
  
const Loading = ({navigation}) =>{
  console.log("loading----------------")
     return <ActivityIndicator color="#1478FF"/>
}
  


const CommentReload = ({route,deleteComment, navigation}) =>{
  console.log("Reloo!!!--------------")
  //여기서 버튼 hide하면 될듯.
  const{loading, error, data} = useQuery(POST_VIEW,{ //댓글 불러오는 쿼리
    variables: {pid: route.id}
  })   
  if(loading){     
 return (<Loading  navigation={navigation}/>);
} 
  if(error) return(<Text>에러!!{error}</Text>);
  console.log(data);
  if(data!=undefined){ //새로고침중 뒤로가기 버튼 눌렀을때 생각.
  allComment = data.seeAllComment 
  allContent = [{id:route.id, UserId: route.userId, 
    createdAt: route.createdAt, text:route.text,
    title:route.title, num:route.num,
    commentLen:data.seeAllComment.length,
    User: route.user,
    __typename:"Post"}]; 
  //console.log("바뀐Comment정보!!!!!!!!", data)
  if(data.seeAllComment.length != 0 && route.fromhome != true){
  const temp = {UserId : route.userId, __typename:"Post", 
          createdAt: route.createdAt, id:route.id,
          text: route.text, title: route.title,
          Comment: data.seeAllComment,
          User: route.user
        };
  
  Datalist.Array[route.num] = temp;
  }

  }
   
  /*for(var i =0; i<Datalist.Array.length ; i++){
  console.log("Datalist.array!!!!",Datalist.Array[i].id)
  }*/ 
  return(
   data.seeAllComment.length != 0?

      <PrintAllContent deleteComment={deleteComment} navigation={navigation}/>
    :
    <SearchPost route ={route} navigation={navigation} deleteComment={deleteComment} /> 
    
    
     
  ); 
} 
    
const SearchPost = ({route,navigation,deleteComment}) =>{
  console.log("@@@@@@@@@searchpost진입")
  const{loading, error, data} = useQuery(POST_INFO,{ //댓글 불러오는 쿼리
    variables: {pid: route.id}
  })
  if(loading) return (<ActivityIndicator color="#1478FF"/>);
  if(error) return(<Text>에러!!{error}</Text>);
 // console.log(data);
  if(data.seePost == null){
    if(!route.fromhome) Datalist.Array[route.num] = {id:route.id, delete: true};
    Alert.alert("삭제된 게시물입니다.")
    return( null );
  }   
  else {
    if(!route.fromhome){
    const temp = {UserId : route.userId, __typename:"Post", 
    createdAt: route.createdAt, id:route.id,
    text: route.text, title: route.title,
    Comment: [],
    User : route.user
  };
    Datalist.Array[route.num] = temp;
    }
  }
 
  return(
    <PrintAllContent deleteComment={deleteComment} navigation={navigation}/>
     );
  
} 
 



const CommentInput=({route,upload,navigation})=>
{ 

  const textref = React.useRef();
  const [text,setText] = useState("");
  const [prevent, setPrevent] = useState(route.prevent);
 console.log("Commentinput!!!");


 React.useEffect(()=>{
  if(prevent){
  
  var temp = text.trim()
  temp=temp.replace(/(\s|\r\n)+/g," ")
  if(temp.length == 0)Alert.alert("댓글을 입력하세요.");
  else{
  textref.current.clear();
  printsnum = 0;
  upload(route.id, temp);
  setText(""); 
  setTimeout(()=>{setPrevent(false);},1000)
  navigation.navigate("Post",{upload:true})}
  }

 },[prevent])
 
  
  return (
  
    <View style={{flexDirection:'row'}}>
  <TextInput
  ref = {textref}
  style={{flex:1, backgroundColor : 'gray'}}
     placeholder="댓글을 입력하세요."
     onChangeText={(val)=>setText(val)}
     multiline
     maxHeight={60}
      /> 
  <Button    
  style={{flex:1}}
  disabled={prevent}
  title="입력" onPress={()=>{
    //console.log("------------------------",route)
    if(!prevent)setPrevent(true)

  }} />
     </View> 
  
     ); 

}
   

  
const CommentContent = React.memo(({route,deleteComment,navigation}) => {
  console.log("commentcontent", route);
  const time = new Date(Number(route.item.createdAt)+TIMEZONE);
  return(
    <View style={styles.card2}>
     <View style={{flexDirection: 'row',justifyContent:'space-between'}}>
      
     <View style={{flexDirection: 'row'}}>
        <Image style={{
        width : 20,
        height: 20,
        margin: 5,
      resizeMode: 'contain'
      }}
      source={require('../assets/igmyeong.png')} />
    {type == 1 ?
    <Text style={{fontSize: 15}}>익명</Text> : <Text style={{fontSize: 15}}>{route.item.User.name}</Text>
    }
      </View>
      { (check(route.item.UserId))?
    <Button title="삭제" onPress={()=>
    {           
      
      Alert.alert(
      "댓글을 삭제하시겠습니까?",
      "", 
      [
        {
          text: "예",
          onPress: () => {
            printsnum = 0;
            deleteComment(route.item.id);
            navigation.navigate("Post",{upload: true});
          },
          style: "cancel"
        },
        { text: "아니오", onPress: () => {return;} }
      ],
      { cancelable: true }
    );
    }}/> : (null)
    }
     </View>
    <HyperlinkedText style={{fontSize:15}}>{route.item.text}</HyperlinkedText>
    <Text style={{fontSize:10}}>{time.getMonth()+1}/{time.getDate()}/{time.getHours()}:{time.getMinutes()}</Text>
    </View>
  );
})
  
const PostStyle = React.memo(({post}) => {
  //console.log("poststtstdsgsijfsifjd!!!",route);
  const time = new Date(Number(post.item.createdAt)+TIMEZONE);
  return(
    <View style={styles.card}>
    <View style={{flexDirection: 'row',justifyContent:'space-between'}}>

        <View style={{flexDirection: 'row'}}>
        <Image style={{
        width : 30,
        height: 30,
        margin: 5,
      resizeMode: 'contain'
      }} 
      source={require('../assets/igmyeong.png')} />
        {type == 1 ?
    <Text style={{fontSize: 15}}>익명</Text>:<Text style={{fontSize:15}}>{post.item.User.name}</Text> 
  }
      </View>
      <Text style={{fontSize: 10}}> {time.getMonth()+1}/{time.getDate()}/{time.getHours()}:{time.getMinutes()}</Text>
    </View>
      <Text style={{fontSize : 25}}>{post.item.title}{"\n"}</Text>
      <HyperlinkedText style={{fontSize : 20}} >{post.item.text}</HyperlinkedText>
 
      <View style={{flexDirection:'row',marginTop:5}}>
      <FontAwesome name="comment-o" size={10} color='blue' />
      <Text style={{fontSize:10,marginLeft:10}}>{post.item.commentLen}</Text>
      </View>
    </View>
  );
} )
 

const CheckUpload = ({navigation}) => {
  //console.log("eeeeee",bid,typeof(bid));
  const [uploadmutation] = useMutation(POST_UPLOAD);
  const upload = async(bid, title, text) =>{
    try{
    const data = await uploadmutation({
      variables: {
        bid: bid,
        title: title,
        text: text
      }
    }
  )}
  catch(e){
    console.log(e); }
  }
  return(<UpdateScreen navigation={navigation} upload={upload} />);
}

export function Upload({route,navigation}) {  
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: {
       Authorization: `Bearer ${userInfo.token}`
      },
  })

  return(<ApolloProvider client={client}>
    <CheckUpload navigation ={navigation} />
    </ApolloProvider>
  );
}
 
const UpdateScreen = ({navigation, upload})=>{
  const [title,setTitle] = useState("");
  const [text, setText] = useState("");


  return(<KeyboardAwareScrollView>
 
      <View style={{flex:1 ,marginTop:40, marginHorizontal:10 ,flexDirection:'row',justifyContent:'space-between'}}>
    <View style = {{flexDirection: 'row'}}>
    <TouchableOpacity  style={{alignSelf:'center'}}
    onPress= {()=>{ 
       navigation.goBack()}}
     >
       <AntDesign name="closecircle" size={30} color="dodgerblue" />
     </TouchableOpacity>
  <Text style={{fontSize:25, marginLeft:10}}>글쓰기</Text>
  </View> 
  <Button title="완료"  
  onPress={() =>{
    var tempTitle = title.trim()
    var tempText = text.trim()
    if(tempTitle.length == 0 || tempText.length == 0) alert("제목, 글 모두 다 입력하세요.")
    else{
      Alert.alert(
        "글을 입력하시겠습니까?",
        "", 
        [
          {
            text: "예",
            onPress: () => {
              upload(Bid,tempTitle,tempText);
              navigation.navigate("Community",{id: Bid,needquery:true})
            },
            style: "cancel"
          },
          { text: "아니오", onPress: () => {return;} }
        ],
        { cancelable: true }
      );
    }   
  }} />
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
    maxLength={textLen}
    value={text}
     />
  </View>
</KeyboardAwareScrollView>
  );
}

 
const styles = StyleSheet.create({
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
  card2: {
    backgroundColor: "white",
    padding: 10,
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 5,
    textAlign: "center",
    justifyContent: "center",
  },
  adcard:{
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -12,
    paddingLeft: 10,
    width: "90%",
    color: '#05375a',
},
});



