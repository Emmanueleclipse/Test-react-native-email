import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    Text,
    View,
    Image,
    FlatList, Platform,
    TouchableOpacity,
    Switch
} from 'react-native';
import Colors from '../Theme/Colors';
import CustomeFonts from '../Theme/CustomeFonts';
import Style from '../Theme/Style';
import { validationempty } from '../Common/Validations';
import { LocalData, Urls } from '../Common/Urls';
import { Indicator, showToast, NoData } from '../Common/CommonMethods';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Axios from 'axios'
import { useIsFocused } from '@react-navigation/native'
import Moment from 'moment';
import { WebView } from 'react-native-webview';
import firebase from '../../firebase';
import Images from '../Theme/Images';
Images


const Home = ({ navigation, route }) => {
    const isFocused = useIsFocused()
    const [isLoding, setLoding] = useState(false);
    const [userArray, setuserArray] = useState([])
    const [linkname, setlinkname] = useState('')
    const [isAll, setisAll] = useState(true);
    const [isToday, setisToday] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [properties, setProperties] = useState(null)
    const [feedProperty, setFeedProperty] = useState(null)

    const toggleSwitch = () => {
        setIsEnabled(previousState => !previousState);
        isEnabled ? ToggleToday() : ToggleAll()
    };

    const getToken = async () => {
        let b = await AsyncStorage.getItem("is_token_register")
        if (b == '0')
            firebase.messaging().getToken().then((token) => {
                if (validationempty(token)) {
                    Apitokensend(token)
                }
            });

        firebase.messaging().onTokenRefresh((token) => {
            if (validationempty(token)) {
                Apitokensend(token)
            }
        });
    }

    const Apitokensend = async (token) => {
        var access = await AsyncStorage.getItem('access')
        const headers = {
            'Authorization': 'Bearer ' + access,
            "content-type": "application/json"
        };

        const params = JSON.stringify({
            "device_token": token,
            "device_type": Platform.OS + '',

        });
        Axios.post(Urls.baseUrl + Urls.notificationa, params,
            { headers })
            .then(async function (response) {
                await AsyncStorage.setItem("is_token_register", '1');
            })
            .catch(function (error) { });
    }

    useEffect(() => {
        getToken()
        setlinkname('')
        apiCall_proprtylist()
    }, [linkname]);

    const apiCall_proprtylist = async () => {
        var access = await AsyncStorage.getItem('access')
        var pk = await AsyncStorage.getItem('pk')
        setLoding(true);

        const headers = {
            'Authorization': 'Bearer ' + access,
            "content-type": "application/json"
        };
        Axios.get(Urls.baseUrl + 'api/property/', { headers })
            .then(response => {
                setLoding(false);
                if (response.data) {
                    let data = []
                    let properties = []
                    response.data.map(item => {
                        properties.push({ name: item.name, address: item.address, pk: item.pk, attachments: item.attachments })
                        return item.activities.map(item => {
                            let arrData = {
                                pk: item.pk,
                                property: item.property,
                                milestone_name: item.milestone_name,
                                description: item.description,
                                created_at: item.created_at,
                                from: item._from,
                                to: item._to,
                                status: item.status,
                                attachments: item.attachments
                            }
                            return data.push(arrData)
                            })
                        })
                        setuserArray(data)
                        setProperties(properties)
                }

            }).catch(function (error) {
                setLoding(false);
                if (error.response) {
                    showToast(error.response.data.detail + "", "error")
                }
            });
    };

    const ToggleToday = () => {
        setisToday(true)
        setisAll(false)
        apiCall_proprtylist()
    }
    
    const ToggleAll = () => {
        setisAll(true)
        setisToday(false)
        apiCall_proprtylist()
    }

    const loadPropertyDetails = (type, item) => {
        if(properties){
            const items =  properties.map(item => item).filter(prop => prop.pk === item)
            setFeedProperty(items[0])
            if(type === 'label')return items[0]?.name
            if(type === 'image') return items[0]?.attachments[0].attachment
        }
    }

    const viewDetails = item => {
        const details = properties.map(item => item).filter(prop => prop.pk === item.property)
        navigation.navigate('Schedule1', { property: details[0], 'item': item })
    }

    const datalength = () => { return isEnabled ? userArray.length : todayMilestones.length }

    const milesTones = userArray?.map(item => item).filter(item => item.status !== 'completed')
    const todayMilestones = userArray?.map(item => item).filter(item => Moment(item.created_at).format('MMMM DD') === Moment().format('MMMM DD'))
    
    return (
        <SafeAreaView style={Style.cointainer}>

            <Text style={[Style.text16, { backgroundColor: Colors.divider, fontFamily: CustomeFonts.Poppins_Bold, height: 56, color: Colors.lightblack, justifyContent: 'center', textAlignVertical: "center", textAlign: 'center' }]}>Feed</Text>

            {isLoding ? (
                <View style={{ alignItems: 'center', }}>
                    <Indicator></Indicator>
                </View>
            ) : (
                <View style={{ flexDirection: 'column', flex: 1 }}>
                    <View style={{ justifyContent: 'center', flexDirection: 'row', alignItems: 'center', margin: 10 }}>
                        <Text>Today</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: Colors.TheamColor3 }}
                            thumbColor={"#f4f3f4"}
                            ios_backgroundColor={Colors.TheamColor3}
                            onValueChange={toggleSwitch}
                            value={isEnabled}
                        ></Switch>
                        <Text>All</Text>

                    </View>

                    {datalength() === 0 && LocalData.FLAG !== '1' ?
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: "center" }} >
                            <Image source={Images.nodata} style={{ height: 120, width: 250 }} resizeMode='contain' />
                            <Text style={[Style.text12, { width: '100%', textAlign: "center" }]}>No activity</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('CreateProperty1')}
                                style={{ height: 40, marginTop: 40, marginLeft: 20, margin: 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 4, backgroundColor: Colors.TheamColor3 }}>
                                <Text style={[Style.text14, { textAlignVertical: 'center', textAlign: 'center', color: Colors.white }]}>Get started</Text>
                            </TouchableOpacity>
                        </View> :
                        <FlatList
                            onRefresh={apiCall_proprtylist}
                            refreshing={isLoding}
                            showsVerticalScrollIndicator={false}
                            data={isEnabled ? milesTones : todayMilestones}
                            renderItem={({ item, index }) => (
                                <View style={{ paddingHorizontal: 10, flexDirection: 'column', marginHorizontal: 10, marginVertical: 3, borderRadius: 5, elevation: 5, backgroundColor: 'white' }}>
                                    <View >
                                        <Text style={[Style.text14, { alignSelf: "center", backgroundColor: Colors.TheamColor, color: Colors.black, padding: 8, }]}>
                                            {Moment(new Date()).format('MMMM DD') === Moment(item.from).format('MMMM DD') ? "Today" : Moment(item.from).format('MMMM DD')}
                                        </Text>
                                        <View style={{ flexDirection: 'row', marginTop: 5, paddingTop: 10 }}>
                                            <View style={{ flex: 1 }} >
                                                <Text style={[Style.text16, { justifyContent: 'center', textAlignVertical: 'center', fontFamily: CustomeFonts.Poppins_Bold }]}>
                                                    {item ? loadPropertyDetails('label', item.property): ''}
                                                </Text>
                                                <View style={{ flex: 1, paddingVertical: 2 }} >
                                                    <Text style={[Style.text14, { justifyContent: 'center', textAlignVertical: 'center', fontFamily: CustomeFonts.Poppins_Regular }]}>
                                                        {feedProperty?.address}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View>
                                                <Text style={[Style.text16, { justifyContent: 'center', color: Colors.TheamColor2, backgroundColor: Colors.lightGreen, paddingHorizontal: 10, padding: 5, borderRadius: 2, fontFamily: CustomeFonts.Poppins_Regular }]}>
                                                    {item.status}
                                                </Text>
                                                {
                                                    feedProperty?.attachments[0].type === 'jpg' || feedProperty?.attachments[0].type === 'jpeg' || feedProperty?.attachments[0].type === 'png' ?
                                                        <Image
                                                            resizeMode='cover'
                                                            style={{ width: 90, height: 70, marginTop: 5 }}
                                                            source={{ uri: Urls.imageUrl + loadPropertyDetails('image', item.property) }}
                                                        /> 
                                                    : null
                                                }
                                            </View>
                                        </View>
                                    </View>
                                    {
                                        validationempty(item) ?
                                            <View>
                                                <View style={{ flexDirection: 'row', paddingBottom: 6 }}>

                                                    <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center', flexDirection: 'column' }}>
                                                        <View style={{ flexDirection: 'row', marginTop: 10, }}>
                                                            <View style={{ flexDirection: 'column', flex: 1 }}>
                                                                <View style={{ flexDirection: "row", alignItems: "center" }} >
                                                                    <Text style={[Style.text16, { textDecorationLine: "underline", fontFamily: CustomeFonts.Poppins_SemiBold }]}>Milestone</Text>
                                                                    <Text style={{ textDecorationLine: "none" }} >{` ${index + 1}`}</Text>

                                                                </View>

                                                                <Text style={[Style.text12, { flex: 2, paddingVertical: 3, fontFamily: CustomeFonts.Poppins_Regular }]}>{item.milestone_name}</Text>
                                                                <Text numberOfLines={2} style={[Style.text12, { flex: 2, marginVertical: 6, marginTop: 20, color: Colors.gray }]}>{item.description}</Text>
                                                            </View>
                                                        </View>


                                                        <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                                                            <TouchableOpacity
                                                                onPress={() => viewDetails(item)}
                                                                style={{ flex: 1, height: 40, margin: 3, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, borderRadius: 4, backgroundColor: Colors.gray_d1 }}>
                                                                <Text style={[Style.text14, { textAlignVertical: 'center', textAlign: 'center', color: Colors.black }]}>View Details</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    if (LocalData.FLAG == '1') {
                                                                        navigation.navigate('HomeOwnerReport', { pr_id: item.property, 'item': item, index: index })
                                                                    }
                                                                    else {
                                                                        navigation.navigate('HomeBuilderReport', { pr_id: item.property, 'item': item, index: index, milestoneArray: item })
                                                                    }
                                                                }}
                                                                style={{ flex: 1, height: 40, margin: 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 4, backgroundColor: Colors.TheamColor3 }}>
                                                                <Text style={[Style.text14, { textAlignVertical: 'center', textAlign: 'center', color: Colors.white }]}>View Milestones</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View style={{ marginTop: 5, height: 1, width: '100%', backgroundColor: Colors.divider }}></View>
                                            </View>
                                        : null
                                    }
                                </View>
                            )}
                            ListEmptyComponent={<NoData itemtext="No activity" />}
                        />}

                    {validationempty(linkname) ?
                        <WebView
                            source={{
                                uri: linkname + ""
                            }}
                            style={{ height: 1, }}
                            startInLoadingState={true}
                            javaScriptEnabled={true}
                        /> : null}
                </View>
            )
            }
        </SafeAreaView >
    );
};



export default Home;


