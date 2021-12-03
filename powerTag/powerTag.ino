#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <espnow.h>
#include <EEPROM.h>
#define EEPROM_SIZE 2

const int analogInPin = A0;  // ESP8266 Analog Pin ADC0 = A0

//MAC Address of the receiver 
uint8_t peer1[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

bool smoke = false, state = false; 
#define SSID1 "SSID1-2.4G"
#define PWD1 "12345678"

void onSent(uint8_t *mac_addr, uint8_t sendStatus) {
  Serial.println("Status:");
  Serial.println(sendStatus);
}

void setup() {
  // initialize serial communication at 115200
  Serial.begin(115200);
//  pinMode(BUILTIN_LED, OUTPUT);
  pinMode(D2, INPUT);
  pinMode(D0, INPUT);
  EEPROM.begin(EEPROM_SIZE);

  // Set device as a Wi-Fi Station
  WiFi.mode(WIFI_AP_STA);

  // Init ESP-NOW
  WiFi.begin(SSID1, PWD1); 
  while (WiFi.status() != WL_CONNECTED) {  //Wait for the WiFI connection completion
 
    delay(500);
    Serial.println("Waiting for connection");
 
  }
  if (esp_now_init() != 0) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Once ESPNow is successfully Init, we will register for Send CB to
  // get the status of Trasnmitted packet
 esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER);
  // Register the peer
  Serial.println("Registering a peer");
  esp_now_add_peer(peer1, ESP_NOW_ROLE_SLAVE, 1, NULL, 0);
  Serial.println("Registering send callback function");
  esp_now_register_send_cb(onSent);
  
  
}

typedef struct struct_message {
    bool state;
    bool smoke;
} struct_message;

struct_message myData;

void loop() {
////////////////////////////---If current sensor--////////////////////////////////////////////////////

//  int data  = analogRead(analogInPin);
//  Serial.print("sensor = ");
//  Serial.println(data );
//    if(data  > 50){
//    state = true;
//    digitalWrite(BUILTIN_LED, LOW);
//  } else {
//     state = false;
//     digitalWrite(BUILTIN_LED, HIGH);
//  }

///////////////////////////--If LDR sensor---////////////////////////////////////////////////////////

  state = !digitalRead(D2);
////////////////////////////////////////////////////////////////////////////////////////////////////

  //smoke on D1
  smoke = !digitalRead(D1);
  
////////////////////////////////////////////////////////////////////////////////////////////////////
  bool savedState, savedSmoke;
  EEPROM.get(0, savedState);
  EEPROM.get(1, savedSmoke);
  if(savedSmoke != 1 && savedSmoke != 0){
       EEPROM.write(1, smoke);
       EEPROM.commit();
       savedSmoke = smoke;
  }
  if(savedState != 1 && savedState != 0){
       EEPROM.write(1, state);
       EEPROM.commit();
       savedState = state;
  }
  if(savedState != state || savedSmoke != smoke){           
            myData.state = state;
            myData.smoke = smoke;
            esp_now_send(NULL, (uint8_t *) &myData, sizeof(myData));
            EEPROM.write(0, state);
            EEPROM.commit();
            EEPROM.write(1, smoke);
            EEPROM.commit();
            if (WiFi.status() == WL_CONNECTED) { //Check WiFi connection status
              HTTPClient http;    //Declare object of class HTTPClient
           
              http.begin("http://192.168.1.4:3300/add");      //Specify request destination
              http.addHeader("Content-Type", "application/x-www-form-urlencoded");  //Specify content-type header
              String macID = String(WiFi.macAddress());
              String _state = state? "1":"0";
              String _smoke = smoke?"1":"0";
              String msg = "state="+_state+
                           "&smoke="+_smoke+
                           "&MAC="+macID;
              int httpCode = http.POST(msg);   //Send the request
              String payload = http.getString();                  //Get the response payload
              Serial.println(httpCode);   //Print HTTP return code
              Serial.println(payload);    //Print request response payload
           
              http.end();  //Close connection
          
            } else {
           
              Serial.println("Error in WiFi connection");
           
              }
  }  
//  delay(5000);
    ESP.deepSleep(10e6);
}
