USE webcode;

CREATE TABLE events (
  `username` varchar(20) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `event_type` varchar(10) NOT NULL,
  `details` varchar(255),
  `event_id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`event_id`)
);
