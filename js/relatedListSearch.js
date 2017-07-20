auth={};
prop={};
$(document).ready(function(){
    ZOHO.embeddedApp.init()
    .then(function(){
        $("#loading").show();
         ZOHO.CRM.CONFIG.getOrgVariable("zillowforpropertyestimate.zillowId ").then(function(data){
            console.log(data);
    auth.zwsId=data.Success.Content;
}).then(ZOHO.CRM.INTERACTION.getPageInfo)
         .then(function(data){
            if(data.entity=="Contacts")
            {
                prop.add=encodeURI(data.data.Mailing_Street).replace(/%20/g,'+');
                prop.ctyStZip=encodeURI(data.data.Mailing_City+" "+data.data.Mailing_State+" "+data.data.Mailing_Zip).replace(/%20/g,'+');
            }
            if(data.entity=="Leads")
            {
                prop.add=encodeURI(data.data.Street).replace(/%20/g,'+');
                prop.ctyStZip=encodeURI(data.data.City+" "+data.data.State+" "+data.data.Zip_Code).replace(/%20/g,'+');
            }
            request = {
        url: "http://www.zillow.com/webservice/GetDeepSearchResults.htm",
        params: { "zws-id": auth.zwsId,
            address: prop.add,
            citystatezip:prop.ctyStZip
        },
        headers: {
           "Content-Type":"text/html"
        }
    }
    console.log(request)
    ZOHO.CRM.HTTP.get(request)
        .then(function(data) {
            var x2js = new X2JS();
            var jsonObj = x2js.xml_str2json( data ); 
            console.log(jsonObj)
            return jsonObj;
        }).then(function(jsonObj){

            var ip="",
    imgDiv="" 
    if(jsonObj.searchresults.message.code!=0)
    {
        return error(jsonObj.searchresults.message.text);

    }
    var homeDetails=jsonObj.searchresults.response.results;  
    if(homeDetails.result)
    {
        if(homeDetails.result.constructor===Array)
        {
        if(homeDetails.result[0].zpid)
        {
            prop.id=homeDetails.result[0].zpid;
        }
        if(homeDetails.result[0].lastSoldDate)
        {
            prop.lastSoldDate=homeDetails.result[0].lastSoldDate;
        }
        if(homeDetails.result[0].lastSoldPrice&&homeDetails.result[0].lastSoldPrice.__text)
        {
            prop.lastSoldPrice=homeDetails.result[0].lastSoldPrice.__text.replace(/\B(?=(\d{3})+\b)/g, ",");
        }
        if(homeDetails.result[0].address&&homeDetails.result[0].address.latitude&&homeDetails.result[0].address.longitude)
        {
            prop.latitude=homeDetails.result[0].address.latitude;
            prop.longitude=homeDetails.result[0].address.longitude;
        }
        }
        else
        {
            if(homeDetails.result.zpid)
        {
            prop.id=homeDetails.result.zpid;
        }
        if(homeDetails.result.lastSoldDate)
        {
            prop.lastSoldDate=homeDetails.result.lastSoldDate;
        }
        if(homeDetails.result.lastSoldPrice&&homeDetails.result.lastSoldPrice.__text)
        {
            prop.lastSoldPrice=homeDetails.result.lastSoldPrice.__text.replace(/\B(?=(\d{3})+\b)/g, ",");
        }
        if(homeDetails.result.address&&homeDetails.result.address.latitude&&homeDetails.result.address.longitude)
        {
            prop.latitude=homeDetails.result.address.latitude;
            prop.longitude=homeDetails.result.address.longitude;
        }
        }
    }
    return jsonObj.searchresults.message.code;
}).then(function(code){
    if(code!=0)
    {
        $("#loading").hide();
        return;
    }
     request = {
        url: "http://www.zillow.com/webservice/GetUpdatedPropertyDetails.htm",
        params: { "zws-id": auth.zwsId,
            zpid: prop.id
        },
        headers: {
           "Content-Type":"text/html"
        }
    }
    ZOHO.CRM.HTTP.get(request)
        .then(function(data) {
            var x2js = new X2JS();
            var json = x2js.xml_str2json( data );
              if(json.updatedPropertyDetails.message.code!=0)
    {
        return error(json.updatedPropertyDetails.message.text);
    } 
       prop.details=json.updatedPropertyDetails.response;
       prop.details.info=[];
       if(prop.details.editedFacts)
       {
       if(prop.details.editedFacts.lotSizeSqFt)
       {
            prop.details.info.push({label:"Lot : ",value:prop.details.editedFacts.lotSizeSqFt})
       }
       if(prop.details.editedFacts.useCode)
       {
            prop.details.info.push({label:"Type : ",value:prop.details.editedFacts.useCode})
       }
       if(prop.details.editedFacts.yearBuilt)
       {
            prop.details.info.push({label:"Year Built : ",value:prop.details.editedFacts.yearBuilt})
       }
       if(prop.details.editedFacts.heatingSources)
       {
            prop.details.info.push({label:"Heating Source : ",value:prop.details.editedFacts.heatingSources})
            prop.details.htSrc="Heating Source :"
       }
       if(prop.details.editedFacts.rooms)
        { 
            rooms=prop.details.editedFacts.rooms.match(/[^,\s][\w- ]*/g);
            prop.details.rooms=rooms;
        }

   }
       if(prop.details.lastSoldDate)
       {
            prop.details.info.push({label:"Last sold on :",value:prop.details.lastSoldDate})
            if(prop.details.lastSoldPrice)
            {
                prop.details.info.push({label:"Last sold on :",value:prop.details.lastSoldDate+" for $"+prop.details.lastSoldPrice})
            }
       }
       if(prop.details.pageViewCount&&prop.details.pageViewCount.total)
       {    
            prop.details.info.push({label:"Total Views :",value:prop.details.pageViewCount.total})
       }
        
        if(prop.details.images)
        {
        if(!(prop.details.images.image.url.constructor===Array))
        {
            var img=prop.details.images.image.url;
            prop.details.images.image.url=[];
            prop.details.images.image.url.push(img);
        }
        }
        return json.updatedPropertyDetails.message.code
        }).then(function(code){
             if(code!=0)
    {
        $("#loading").hide();
        return;
    }
            request = {
        url: "http://www.zillow.com/webservice/GetZestimate.htm",
        params: { "zws-id": auth.zwsId,
            zpid: prop.id, 
            rentzestimate:true
        },
        headers: {
           "Content-Type":"text/html"
        }
    }
    ZOHO.CRM.HTTP.get(request)
        .then(function(data) {
            var x2js = new X2JS();
            var jsonObj = x2js.xml_str2json( data );
            if(jsonObj.zestimate.message.code!=0)
            {
                return error(jsonObj.zestimate.message.text)
            } 
            resp=jsonObj.zestimate.response;
            console.log(resp)
            return(resp);
        }).then(function(resp){
            if(resp.zestimate)
            {
                var zes=resp.zestimate;
                if(zes.valuationRange&&zes.valuationRange.high&&zes.valuationRange.high.__text&&zes.valuationRange.low&&zes.valuationRange.low.__text&&zes.amount&&zes.amount.__text)
                {
                    prop.details.zesPercent=(parseInt(zes.amount.__text)*100)/(parseInt(zes.valuationRange.high.__text)+parseInt(zes.valuationRange.low.__text));
                }
                if(zes.amount&&zes.amount.__text)
                {
                    prop.details.zesAmount=parseAmt(zes.amount.__text);
                }
                if(zes.valuationRange&&zes.valuationRange.high&&zes.valuationRange.high.__text)
                {
                   prop.details.zesAmountChangeHigh=amtFormatter(zes.valuationRange.high.__text);
                }
                if(zes.valuationRange&&zes.valuationRange.low&&zes.valuationRange.low.__text)
                {
                    prop.details.zesAmountChangeLow=amtFormatter(zes.valuationRange.low.__text)
                }   
                if(zes.valueChange._duration)
                {
                    prop.details.valChangeDuration=zes.valueChange._duration;
                }
                if(zes.valueChange&&zes.valueChange.__text)
                {
                    prop.details.zesAmountChange=parseAmt(zes.valueChange.__text)
                }
            }
            if(resp.rentzestimate)
            {
                var zes=resp.rentzestimate;
                if(zes.valuationRange&&zes.valuationRange.high&&zes.valuationRange.high.__text&&zes.valuationRange.low&&zes.valuationRange.low.__text&&zes.amount&&zes.amount.__text)
                {
                    prop.details.rentzesPercent=(parseInt(zes.amount.__text)*100)/(parseInt(zes.valuationRange.high.__text)+parseInt(zes.valuationRange.low.__text));
                }
                if(zes.amount&&zes.amount.__text)
                {
                    prop.details.rentzesAmount=parseAmt(zes.amount.__text);
                }
                if(zes.valuationRange&&zes.valuationRange.high&&zes.valuationRange.high.__text)
                {
                   prop.details.rentzesAmountChangeHigh=amtFormatter(zes.valuationRange.high.__text);
                }
                if(zes.valuationRange&&zes.valuationRange.low&&zes.valuationRange.low.__text)
                {
                    prop.details.rentzesAmountChangeLow=amtFormatter(zes.valuationRange.low.__text)
                }   
                if(zes.valueChange._duration)
                {
                    prop.details.rentvalChangeDuration=zes.valueChange._duration;
                }
                if(zes.valueChange&&zes.valueChange.__text)
                {
                    prop.details.rentzesAmountChange=parseAmt(zes.valueChange.__text)
                }
            }
            prop.details.rentValChangeDuration=resp.rentzestimate.valueChange._duration;
        }).then(function(){request={
            url: "http://www.zillow.com/webservice/GetChart.htm",
        params: { "zws-id": auth.zwsId,
            zpid: prop.id, 
            "unit-type":"dollar",
            height:"300",
            width:"520",
            chartDuration:"10years" 
        },
        headers: {
           "Content-Type":"text/html"
        }
            }
            ZOHO.CRM.HTTP.get(request)
        .then(function(data) {
            var x2js = new X2JS();
            var jsonObj = x2js.xml_str2json( data );
            prop.details.chart=jsonObj.chart.response.url; 
    }).then(function(){
        request = {
        url: "http://www.zillow.com/webservice/GetDeepComps.htm",
        params: { "zws-id": auth.zwsId,
            zpid: prop.id, 
            count:5
        },
        headers: {
           "Content-Type":"text/html"
        }
    }
    ZOHO.CRM.HTTP.get(request)
        .then(function(data) {
            var x2js = new X2JS();
            var jsonObj = x2js.xml_str2json( data );
            if(jsonObj&&jsonObj.comps&&jsonObj.comps.response)
            {
                compDetails=jsonObj.comps.response.properties.comparables.comp;
            }
            else
            {
                return error(jsonObj.comps.message.text);
            }
            return compDetails;
    }).then(function(compDetails){
        if(compDetails&&compDetails.constructor===Array)
        {
           $.each(compDetails,function(index,home){
            if(home.zestimate)
            {
                if(home.zestimate.amount&&home.zestimate.amount.__text)
                {
                    home.zestimate.amount.__text=home.zestimate.amount.__text.replace(/\B(?=(\d{3})+\b)/g, ",");
                }
                if(home.zestimate.valuationRange&&home.zestimate.valuationRange.high.__text)
                {
                    home.zestimate.valuationRange.high.__text=home.zestimate.valuationRange.high.__text.replace(/\B(?=(\d{3})+\b)/g, ",");
                }
                if(home.zestimate.valuationRange.low&&home.zestimate.valuationRange.low.__text)
                {
                    home.zestimate.valuationRange.low.__text=home.zestimate.valuationRange.low.__text.replace(/\B(?=(\d{3})+\b)/g, ",");
                }
                if(home.lastSoldPrice&&home.lastSoldPrice.__text)
                {
                    home.lastSoldPrice.__text=home.lastSoldPrice.__text.replace(/\B(?=(\d{3})+\b)/g, ",");
                }
            }    
           })
        }
    prop.details.comparables=compDetails;
    renderTemplate("propertyScript","propertyContentDiv",prop.details)
    }).then(function(){
         $("#loading").hide();
          ZOHO.CRM.CONFIG.getOrgVariable("zillowforpropertyestimate.gMapApi").then(function(data){
    auth.gMapApi=data.Success.Content;

}).then(function(){
     console.log(auth.gMapApi);
         var frame = document.createElement('iframe');
      frame.width="100%";
     frame.height="300px";
frame.src = "https://www.google.com/maps/embed/v1/place?q="+prop.add+","+prop.ctyStZip+"&key="+auth.gMapApi;
document.getElementById('googleMap').appendChild(frame);
})

    })
    })
        })
    })
        
})
         })

})
})
function error(msg)
{
    document.getElementById("errorDiv").innerHTML=msg;
}

function amtFormatter(num) {
    if(num>999&&num<=99999)
    {
        return (num/1000).toFixed(2) + 'K'
    }
    if(num>99999)
    {
        return (num/1000000).toFixed(2) + 'M'
    }
}
function parseAmt(amt){
    return amt.replace(/\B(?=(\d{3})+\b)/g, ",");
}
 function renderTemplate(scriptId, divId, data) {
    var tempSrc = $('#' + scriptId).html();
    var tempTemplate = Handlebars.compile(tempSrc);
    $("#" + divId).html(tempTemplate(data));
    $('.flexslider').flexslider({
        animation: "slide",
        animationLoop: false,
        itemWidth: 430,
        itemMargin: 5,
        pausePlay: true,
        start: function(slider){
          $('body').removeClass('loading');
        }
      });
}
function viewBiggerMap()
{
    window.open("https://www.google.com/maps/embed?origin=mfe&pb=!1m2!2m1!1s%27+data.lat+%27,%27+data.lon+%27!3m1!1ses%3Bz%3D14!5m1!1ses%3Bz%3D14")
}
    function generateHomeDetails(name,index)
 {

console.log(prop)
     request = {
        url: "http://www.zillow.com/webservice/GetDeepSearchResults.htm",
        params: { "zws-id": auth.zwsId,
            address: encodeURI(name).replace(/%20/g,'+'),
            citystatezip:encodeURI(prop.ctyStZip).replace(/%20/g,'+')            
            
        },
        headers: {
           "Content-Type":"text/html"
        }
    }
    ZOHO.CRM.HTTP.get(request)
        .then(function(data) {
            var x2js = new X2JS();
            var jsonObj = x2js.xml_str2json( data );
            if(jsonObj.searchresults.response&&jsonObj.searchresults.response.results&&jsonObj.searchresults.response.results.result&&jsonObj.searchresults.response.results.result.zpid)
            {
                return renderHomeDetails(jsonObj.searchresults.response.results.result.zpid,name,index)
            }
        })

 }
 function renderHomeDetails(propId,propName,index)
 {
    window.open("https://www.zillow.com/homedetails/"+encodeURI(propName).replace(/%20/g,'-')+"-"+encodeURI(prop.ctyStZip).replace(/%20/g,'-')+"/"+propId+"_zpid",'_blank');
 }
