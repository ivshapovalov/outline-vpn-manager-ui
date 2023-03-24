<?php

namespace OutlineServerManager\classes;

class LogConfig
{
    public static function getLogConfig(string $logPath, string $logName): array
    {
        return array(
            'rootLogger' => array(
                'level' => 'DEBUG',
                'appenders' => array('myConsoleAppender', 'myRollingFileAppender'),
            ),
            'appenders' => array(
                'myRollingFileAppender' => array(
                    'class' => 'LoggerAppenderRollingFile',
                    'layout' => array(
                        'class' => 'LoggerLayoutPattern',
                        'params' => array(
                            'conversionPattern' => '%date [%logger][%p] %message%newline'
                        )
                    ),
                    'params' => array(
                        'file' => $logPath . "/" . $logName . ".log",
                        'append' => true,
                        'maxFileSize' => "10MB",
                        'maxBackupIndex' => "100"
                    )
                ),
                'myConsoleAppender' => array(
                    'class' => "LoggerAppenderConsole",
                    'layout' => array(
                        'class' => 'LoggerLayoutPattern',
                        'params' => array(
                            'conversionPattern' => '%date [%logger][%p] %message%newline'
                        )
                    )
                )
//            'myDailyFileAppender' => array(
//                'class' => 'LoggerAppenderDailyFile',
//                'layout' => array(
//                    'class' => 'LoggerLayoutPattern',
//                    'params' => array(
//                        'conversionPattern' => '%date [%logger][%p] %message%newline'
//                    )
//                ),
//                'params' => array(
//                    'file' => $logpath. "/" . $logname."-%s.log",
//                    'append' => true,
//                    'datePattern' => "Y-m-d"
//                )
//            )            
//            'myFileAppender' => array(
//                'class' => 'LoggerAppenderFile',
//                'layout' => array(
//                    'class' => 'LoggerLayoutPattern',
//                    'params' => array(
//                        'conversionPattern' => '%date [%logger][%p] %message%newline'
//                    )
//                ),
//                'params' => array(
//                    'file' => "$logpath",
//                    'append' => true
//                )
//            )           
            )
        );
    }
}