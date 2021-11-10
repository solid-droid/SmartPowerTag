#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <espnow.h>
#include <EEPROM.h>
#define EEPROM_SIZE 1

const int analogInPin = A0;  // ESP8266 Analog Pin ADC0 = A0

//MAC Address of the receiver 
uint8_t peer1[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

int data; 
#define SSID1 "SSID1-2.4G"
#define PWD1 "12345678"

void onSent(uint8_t *mac_addr, uint8_t sendStatus) {
  Serial.println("Status:");
  Serial.println(sendStatus);
}

void setup() {
  // initialize serial communication at 115200
  Serial.begin(115200);
  pinMode(BUILTIN_LED, OUTPUT);

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
    int reading;
} struct_message;

struct_message myData;

void loop() {
  // read the analog in value
  data  = analogRead(analogInPin);
  bool state = false;
  // print the readings in the Serial Monitor
  Serial.print("sensor = ");
  Serial.println(data );
  if(data  > 50){
    state = false;
    digitalWrite(BUILTIN_LED, LOW);
  } else {
     state = true;
     digitalWrite(BUILTIN_LED, HIGH);
  }
  bool savedState;
  EEPROM.get(0, savedState);
  if(savedState != state){

            
            myData.reading = data;
            esp_now_send(NULL, (uint8_t *) &myData, sizeof(myData));
            EEPROM.put(0, state);
            EEPROM.commit();
            if (WiFi.status() == WL_CONNECTED) { //Check WiFi connection status
           
              HTTPClient http;    //Declare object of class HTTPClient
           
              http.begin("http://192.168.1.7:3300/add");      //Specify request destination
              http.addHeader("Content-Type", "application/x-www-form-urlencoded");  //Specify content-type header
              String macID = String(WiFi.macAddress());
              int httpCode = http.POST("data="+String(data)+"&MAC="+macID);   //Send the request
              String payload = http.getString();                  //Get the response payload
           
              Serial.println(httpCode);   //Print HTTP return code
              Serial.println(payload);    //Print request response payload
           
              http.end();  //Close connection
          
            } else {
           
              Serial.println("Error in WiFi connection");
           
              }
  }  
    ESP.deepSleep(30e6);
}
