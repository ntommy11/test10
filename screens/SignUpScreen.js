import React from 'react';
import {
    View,
    Text,
    Button,
    TouchableOpacity,
    Dimensions,
    TextInput,
    Platform,
    StyleSheet,
    Alert,
    ScrollView
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Feather from 'react-native-vector-icons/Feather';
import { ApolloClient, InMemoryCache, useQuery, ApolloProvider, useMutation } from "@apollo/client";
import { CREATE_ACCOUNT, DATABASE_URL } from '../queries';
import { UserContext } from '../components/context';

const EMAIL_RE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const NUM_LEN = 8; // 학번 길이

const Main = ({ navigation }) => {
    const [data, setData] = React.useState({
        email: '',
        username: '',
        password: '',
        repassword: '',
        number:'',
        check_text: false,
    });

    const [createAccountMutation] = useMutation(CREATE_ACCOUNT);

    const handleEmailChange = (val) => {
        setData({
            ...data,
            email: val
        })
    }
    const handleUsernameChange = (val) => {
        setData({
            ...data,
            username: val
        })
    }
    const handlePasswordChange = (val) => {
        setData({
            ...data,
            password: val
        })
    }
    const handleRepasswordChange = (val) => {
        setData({
            ...data,
            repassword: val
        })
    }
    const handleNumberChange = (val)=>{
        setData({
            ...data,
            number: val
        })
    }


    const handleSignup = async (email, username, number, password, repassword) => {
        if (EMAIL_RE.test(email)==false){
            Alert.alert("이메일 형식을 확인하세요");
        }else if (username == ''){
            Alert.alert("이름을 입력하세요");
        }else if (number.length != NUM_LEN){
            Alert.alert("학번을 확인하세요");
        }else if(password == ''){
            Alert.alert("비밀번호를 입력하세요");
        }else if (password != repassword) {
            Alert.alert("비밀번호를 확인해주세요")
        }else {
            try {
                let default_grade = 2;
                const { data, loading, error } = await createAccountMutation({
                    variables: {
                        email: email,
                        name: username,
                        password: password,
                        grade: default_grade,
                        number: number
                    }
                })
                console.log("data:", data);
                console.log("loading:", loading);
                console.log("error:", error);
                if (data) {
                    alert("회원가입 성공! 다시 로그인해주세요");
                    navigation.navigate('SignInScreen');
                }
                if (error) {
                    alert(error);
                }
            } catch (e) {
                console.log("handleSignup error:", e);
                alert("이미 존재하는 이메일입니다");
            }
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.text_header}>빠르게 가입하세요!</Text>
            </View>
            <Animatable.View style={styles.footer} animation="fadeInUpBig">
                <ScrollView>
                <Text style={styles.text_footer}>이메일</Text>
                <View style={styles.action}>
                    <TextInput
                        placeholder="이메일을 입력하세요"
                        style={styles.TextInput}
                        autoCapitalize="none"
                        onChangeText={(text) => handleEmailChange(text)}
                    ></TextInput>
                    <Feather name="check-circle" color="#1478FF" size={2} />
                </View>
                <Text style={[styles.text_footer, { marginTop: 20 }]}>이름</Text>
                <View style={styles.action}>
                    <TextInput
                        placeholder="이름을 입력하세요"
                        style={styles.TextInput}
                        autoCapitalize="none"
                        onChangeText={(text) => handleUsernameChange(text)}
                    ></TextInput>
                    <Feather name="check-circle" color="#1478FF" size={2} />
                </View>
                <Text style={[styles.text_footer, { marginTop: 20 }]}>학번</Text>
                <View style={styles.action}>
                    <TextInput
                        placeholder="학번을 입력하세요"
                        style={styles.TextInput}
                        autoCapitalize="none"
                        onChangeText={(text) => handleNumberChange(text)}
                    ></TextInput>
                    <Feather name="check-circle" color="#1478FF" size={2} />
                </View>
                <Text style={[styles.text_footer, { marginTop: 20 }]}>비밀번호</Text>
                <View style={styles.action}>
                    <TextInput
                        placeholder="비밀번호를 입력하세요"
                        style={styles.TextInput}
                        autoCapitalize="none"
                        secureTextEntry={true}
                        size={20}
                        onChangeText={(text) => handlePasswordChange(text)}
                    ></TextInput>
                    <Feather name="check-circle" color="#1478FF" size={2} />
                </View>
                <Text style={[styles.text_footer, { marginTop: 20 }]}>비밀번호 확인</Text>
                <View style={styles.action}>
                    <TextInput
                        placeholder="다시 한번 비밀번호를 입력하세요"
                        style={styles.TextInput}
                        autoCapitalize="none"
                        secureTextEntry={true}
                        onChangeText={(text) => handleRepasswordChange(text)}
                    ></TextInput>
                    <Feather name="check-circle" color="#1478FF" size={2} />
                </View>
                <View style={{alignItems:"center"}}>
                    <TouchableOpacity style={styles.button} onPress={() => {
                        handleSignup(data.email, data.username, data.number, data.password, data.repassword);
                    }}>
                        <Text style={{ fontSize: 20, color: "white" }}>가입 신청하기</Text>
                    </TouchableOpacity>
                </View>
                </ScrollView>
            </Animatable.View>
        </View>
    );
};

export default SignUpScreen = ({ navigation }) => {
    console.log("SignUpScreen rendering");
    const client = new ApolloClient({
        uri: "http://52.251.50.212:4000/",
        cache: new InMemoryCache(),
    });
    return (
        <ApolloProvider client={client}>
            <Main navigation={navigation} />
        </ApolloProvider>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A6EFF'
    },
    header: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 50
    },
    footer: {
        flex: 3,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 30
    },
    text_header: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 30
    },
    text_footer: {
        color: '#1478FF',
        fontSize: 18
    },
    action: {
        flexDirection: 'row',
        marginTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f2',
        paddingBottom: 5
    },
    actionError: {
        flexDirection: 'row',
        marginTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#FF0000',
        paddingBottom: 5
    },
    textInput: {
        flex: 1,
        marginTop: Platform.OS === 'ios' ? 0 : -12,
        paddingLeft: 10,
        width: "90%",
        color: '#05375a',
        fontSize: 17,
    },
    errorMsg: {
        color: '#FF0000',
        fontSize: 14,
    },
    button: {
        alignItems: 'center',
        marginTop: 20,
        borderStyle: "dashed",
        borderWidth: 1,
        padding: 10,
        width: "80%",
        borderRadius: 10,
        backgroundColor: "#0A6EFF",
        borderColor: "white"
    },
    signIn: {
        width: '100%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10
    },
    textSign: {
        fontSize: 18,
        fontWeight: 'bold'
    }
});