'use strict'
const uuidV1 = require('uuid/v1');
let grpc = require('grpc');
let jspb = require('google-protobuf');
let Long = require("long");
var _ = require('underscore');

var hdr = require('hdr-histogram-js');

//Requiring config file
let Config = require('./config');
let config = new Config();

//Connection url string extracted from config file
let connectionURL = config.host + ':' + config.port;


let glowroot_home = __dirname;
let collectorPath = glowroot_home + '/proto/CollectorService.proto';
let agentConfigPath = glowroot_home + '/proto/AgentConfig.proto';
let AggregatePath = glowroot_home + '/proto/Aggregate.proto';
let commonPath = glowroot_home + '/proto/Common.proto';
let collectorService = grpc.load(collectorPath).org_glowroot_wire_api_model;
let agentConfig = grpc.load(agentConfigPath).org_glowroot_wire_api_model;
let Aggregate_pb = grpc.load(AggregatePath).org_glowroot_wire_api_model;
let common = grpc.load(commonPath).org_glowroot_wire_api_model;

let os = require('os');
let async = require('async');

let client = new collectorService.CollectorService(connectionURL,
                                          grpc.credentials.createInsecure());

var ClientStub = {

    //getAgentConfig function gives all basic information in the context of agent
    getAgentConfig: function (){

        let TransactionConfig = { 
            slow_threshold_millis: { value: 2000 },
            profiling_interval_millis: { value: 1000 },
            capture_thread_stats: true 
        };
        
        let UiConfig =  { 
            default_displayed_transaction_type: '',
            default_displayed_percentile: [50.0, 95.0, 99.0] 
        };

        let UserRecordingConfig = { 
            user: [], 
            profiling_interval_millis: { value: 1000 } 
        };

        let AdvancedConfig = { 
              weaving_timer: false,
              immediate_partial_store_threshold_seconds: { value: 60 },
              max_aggregate_transactions_per_type: { value: 500 },
              max_aggregate_queries_per_type: { value: 500 },
              max_aggregate_service_calls_per_type: { value: 500 },
              max_trace_entries_per_transaction: { value: 5000 },
              max_stack_trace_samples_per_transaction: { value: 50000 },
              mbean_gauge_not_found_delay_seconds: { value: 60 } 
        };

        //Agent Config Contains all of the basic information regarding agent and system on which it is running and service
        //for which it's capturing data.
        let AgentConfig = { 
              agent_version: '0.01',
              transaction_config: TransactionConfig,
              ui_config: UiConfig,
              user_recording_config: UserRecordingConfig,
              advanced_config: AdvancedConfig,
              gauge_config: [],
              alert_config: [],
              plugin_config: [],
              instrumentation_config: [] 
            };

        return AgentConfig
    },
    getInitMessage: function (hostInfo, appname){
        let HostInfo = { 
            host_name: hostInfo.host,
            available_processors: hostInfo.cpuCore ,
            total_physical_memory_bytes: { value: hostInfo.totalmem },
            os_name: hostInfo.type,
            os_version: os.release() 
        };

        let start_time = new Long(0xFFFFFFFF, 0x7FFFFFFF);
        start_time = hostInfo.timestamp;
        let process_id = new Long(0xFFFFFFFF, 0x7FFFFFFF);
        process_id = process.pid;
        //ProcessInfo contains the process id and time when process started on host machine
        let ProcessInfo = { 
            process_id: { value:process_id },
            start_time: start_time
        };

        //let JavaInfo = new collectorService.JavaInfo();
        //Consolidation for environment related data is done here
        let Environment = { 
            host_info: HostInfo,
            process_info: ProcessInfo
        };
        
        //The initial message which sent to start the connection
        let InitMessage = { 
          agent_id: hostInfo.host,
          agent_rollup_id: appname,
          environment: Environment,
          agent_config: this.getAgentConfig() 
        };

        client.collectInit(InitMessage, function(err, response) {
            if(err){
                console.log('Error',err)
            }
            else{
                console.log('Response',response);
            }
        });
    },
    collectAggregateStream: function (http, hostInfo, overallHDR, totalDuration, totalTransaction, totalErrorCount) {
        let call = client.collectAggregateStream(function(error, response) {
            if (error) {
                console.log('CollectAggregateStream Error',error);
            }
            else{

                console.log('CollectAggregateStream',response);
            }
        });

        let longVal = new Long(0xFFFFFFFF, 0x7FFFFFFF);
        longVal = new Date(Date.now()).getTime();
        
        //It contains agent ID and capture time i.e. when trace was captured.
        let AggregateStreamHeader = {
            agent_id: hostInfo.host,
            capture_time: longVal
        };
        
        //Aggregate Header sent after wrapping it in stream message.
        let AggregateStreamMessageHeader = {
            stream_header: AggregateStreamHeader,
            shared_query_text: null,
            overall_aggregate: null,
            transaction_aggregate: null
        };
        
        //Its contains data about shared queries
        let SharedQueryText = {
            full_text: 'hello world 2',
            truncated_text: '',
            full_text_sha1: ''
        };
        let AggregateStreamMessageSQT = {
            stream_header: null,
            shared_query_text: SharedQueryText,
            overall_aggregate: null,
            transaction_aggregate: null
        };

        let transaction_count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
        transaction_count = totalTransaction;
        let error_count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
        error_count = totalErrorCount;
        let count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
        count = totalTransaction;
        
        let main_thread_stats = {
            total_cpu_nanos: { value: 400 },
            total_blocked_nanos: { value: 10 },
            total_waited_nanos: { value: 20 },
            total_allocated_bytes: { value: 360 }
        };

        let overallHistogram = overallHDR;
        const buffer = hdr.ByteBuffer.allocate();
        overallHistogram.encodeIntoByteBuffer(buffer);

        let duration_nanos_histogram = {
            ordered_raw_value: [],
            encoded_bytes: new Buffer(buffer.data)
        };

        let main_thread_root_timer = {
            name: 'abc',
            extended: false,
            total_nanos: 100,
            count: count,
            child_timer: []
        };
        let execution_count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
        execution_count = 101;
        let query = {
            full_text: 'select * from emp',
            shared_query_text_index: 0,
            total_duration_nanos: 0,
            execution_count: execution_count,
            total_rows: { value: 10 }
        };
        let queries_by_type = {
            type: 'SQL',
            query: [query]
        };

        //TODO For Node JS Tracing
        let Aggregate = {
            total_duration_nanos: totalDuration,// * totalTransaction,
            transaction_count: transaction_count,
            error_count: error_count,
            async_transactions: true,
            // main_thread_root_timer: [main_thread_root_timer],
            // aux_thread_root_timer: [main_thread_root_timer],
            // async_timer: [main_thread_root_timer],
            // main_thread_stats: main_thread_stats,
            // aux_thread_stats: main_thread_stats,
            duration_nanos_histogram: duration_nanos_histogram,
            queries_by_type: [queries_by_type],
            service_calls_by_type: [],
            // main_thread_profile: null,
            // aux_thread_profile: null
        };

        let OverallAggregate = {
            transaction_type: 'App',
            aggregate: Aggregate
        };
        let AggregateStreamMessageOA = {
            stream_header: null,
            shared_query_text: null,
            overall_aggregate: OverallAggregate,
            transaction_aggregate: null
        };
        call.write(AggregateStreamMessageHeader);
        call.write(AggregateStreamMessageSQT);
        call.write(AggregateStreamMessageOA);
        let transactions = _.values(http);
        transactions.forEach(function(item){
            let transaction_count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
            transaction_count = item.count;
            let error_count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
            error_count = item.error_count;
            let count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
            count = item.count;
            
            let main_thread_stats = {
                total_cpu_nanos: { value: 400 },
                total_blocked_nanos: { value: 10 },
                total_waited_nanos: { value: 20 },
                total_allocated_bytes: { value: 360 }
            };
            let itemHistogram = item.hdr;
            const buffer = hdr.ByteBuffer.allocate();
            itemHistogram.encodeIntoByteBuffer(buffer);

            let duration_nanos_histogram = {
                ordered_raw_value: [],
                encoded_bytes: new Buffer(buffer.data)
            };

            let main_thread_root_timer = {
                name: 'abc',
                extended: false,
                total_nanos: 100,
                count: count,
                child_timer: []
            };
            
            let execution_count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
            execution_count = 101;
            let query = {
                full_text: 'select * from emp',
                shared_query_text_index: 0,
                total_duration_nanos: 0,
                execution_count: execution_count,
                total_rows: { value: 10 }
            };
            let queries_by_type = {
                type: 'SQL',
                query: [query]
            };

            let service_calls = [];
            if(item.externals === []){

            }
            else{
                let externalData = _.values(item.externals);
                externalData.forEach(function(ext){
                    let execution_count_service = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                    execution_count_service = ext.count;
                    let service_call = {
                        text: ext.url,
                        total_duration_nanos: ext.time,
                        execution_count: execution_count_service
                    } 
                    let service_calls_by_type = {
                        type: ext.method,
                        service_call: [service_call]
                    }
                    service_calls.push(service_calls_by_type);
                });
            }

            //TODO For Node JS Tracing
            let Aggregate = {
                total_duration_nanos: item.duration,// * item.count,
                transaction_count: transaction_count,
                error_count: error_count,
                async_transactions: true,
                // main_thread_root_timer: [main_thread_root_timer],
                // aux_thread_root_timer: [main_thread_root_timer],
                // async_timer: [main_thread_root_timer],
                // main_thread_stats: main_thread_stats,
                // aux_thread_stats: main_thread_stats,
                duration_nanos_histogram: duration_nanos_histogram,
                queries_by_type: [queries_by_type],
                service_calls_by_type: service_calls,
                // main_thread_profile: null,
                // aux_thread_profile: null
            };
            let TransactionAggregate = {
                transaction_type: 'App',
                transaction_name: item.url,
                aggregate: Aggregate
            };
            let AggregateStreamMessageTA = {
                stream_header: null,
                shared_query_text: null,
                overall_aggregate: null,
                transaction_aggregate: TransactionAggregate
            };
            call.write(AggregateStreamMessageTA);
        });    
        call.end();
    },
    collectGaugeValue: function (hostInfo) {
        let GaugeValue = new collectorService.GaugeValue();
        let capture_time = new Long(0xFFFFFFFF, 0x7FFFFFFF);
        capture_time = 10;
        let weight = new Long(0xFFFFFFFF, 0x7FFFFFFF);
        weight = 10;
        GaugeValue = { gauge_name: '',
            capture_time: capture_time,
            value: 0,
            weight: weight
        };

        let GaugeValueMessage = new collectorService.GaugeValueMessage();
        GaugeValueMessage = {
            agent_id: hostInfo.host,
            gauge_values: [GaugeValue]
        };

        client.collectGaugeValues(GaugeValueMessage, function(err, response) {
            if(err){
                console.log('Error',err)
            }
            else{
                console.log('GaugeValueMessage',response);
            }
        });
    },
    collectTraceStream: function (http, hostInfo, totalDuration, totalTransaction, totalErrorCount) {
        let transactions = _.values(http);

        transactions.map(function(item,i){

            let errors = _.values(item.errors);
                errors.map(function(errorObject,i){

                //We are looping over erros for a particular transaction and pushing them into entry array of Trace.
                if(errorObject.length > 0){
                    errorObject.forEach(function(err){
                        let trace = client.collectTraceStream(function(error, response) {
                            if (error) {
                                console.log('TraceStream Error',error);
                            }
                            else{

                                console.log('TraceStream',response);
                            }
                        });
                        
                        let longVal = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        longVal = new Date(Date.now()).getTime();
                        let SharedQueryText = {
                            full_text: 'hello world',
                            truncated_text: '',
                            full_text_sha1: ''
                        };

                        let TraceStreamHeader = { 
                            agent_id: hostInfo.host,
                            trace_id: uuidV1(),
                            update : false
                        };
                        let TraceStreamMessageH = {
                          stream_header: TraceStreamHeader,
                          shared_query_text: null,
                          trace: null,
                          entry: null,
                          main_thread_profile: null,
                          aux_thread_profile: null,
                          header: null,
                          stream_counts: null 
                        };
                        trace.write(TraceStreamMessageH);

                        let TraceSharedQueryText = {
                            full_text: 'Tansaction Shared',
                            truncated_text: '',
                            truncated_end_text: '',
                            full_text_sha1: '' };
                        let TraceStreamMessageSQT = {
                          stream_header: null,
                          shared_query_text: TraceSharedQueryText,
                          trace: null,
                          entry: null,
                          main_thread_profile: null,
                          aux_thread_profile: null,
                          header: null,
                          stream_counts: null 
                        };
                        trace.write(TraceStreamMessageSQT);
                        // let main_thread_profile_sample_count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        // main_thread_profile_sample_count = 10000;
                        // let aux_thread_profile_sample_count = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        // aux_thread_profile_sample_count = 1000;

                        let attribute = {
                            name: 'aa',
                            value: ['bb']
                        };
                        let DetailValue = {
                            long: longVal
                        }

                        let detail_entry = {
                            name: 'aa',
                            value: [DetailValue],
                            child_entry: []
                        };
                        let error = {
                            message: errorObject[0].message,
                            exception: null
                        };
                        let total_nanos = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        total_nanos = totalDuration;
                        // let main_thread_root_timerT = {
                        //     name: '',
                        //     extended: false,
                        //     total_nanos: total_nanos,
                        //     count: total_nanos,
                        //     active: false,
                        //     child_timer: [] }
                        // let aux_thread_root_timer = new collectorService.Trace.Timer();
                        // let async_timer = new collectorService.Trace.Timer();
                        // let main_thread_statsT = new collectorService.Trace.ThreadStats();

                        // let cpu_nanos = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        // cpu_nanos = 360;
                        // let total_cpu_nanos = new common.OptionalInt64();
                        // total_cpu_nanos = {
                        //     value: cpu_nanos
                        // };

                        // let blocked_nanos = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        // blocked_nanos = 40;
                        // let total_blocked_nanos = new common.OptionalInt64();
                        // total_blocked_nanos = {
                        //     value: blocked_nanos
                        // };

                        // let waited_nanos = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        // waited_nanos = 360;
                        // let total_waited_nanos = new common.OptionalInt64();
                        // total_waited_nanos = {
                        //     value: waited_nanos
                        // };

                        // let allocated_bytes = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        // allocated_bytes = 2048;
                        // let total_allocated_bytes = new common.OptionalInt64();
                        // total_allocated_bytes = {
                        //     value: allocated_bytes
                        // };
                        // main_thread_statsT = {
                        //     total_cpu_nanos: total_cpu_nanos,
                        //     total_blocked_nanos: total_blocked_nanos,
                        //     total_waited_nanos: total_waited_nanos,
                        //     total_allocated_bytes: total_allocated_bytes
                        // };
                        // let aux_thread_stats = new collectorService.Trace.ThreadStats();

                        let QueryEntryMessage =
                            {
                                shared_query_text_index: 1,
                                prefix: 'aa',
                                suffix: 'zz'
                            };
                        let entry = {
                            depth: 0,
                            start_offset_nanos: longVal,
                            duration_nanos: longVal,
                            active: true,
                            message: 'entry message',
                            query_entry_message: QueryEntryMessage,
                            detail_entry: [detail_entry],
                            location_stack_trace_element: [],
                            error: error
                        };
                        let capture_time = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        capture_time = item.timestamp;
                        let start_time = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        start_time = hostInfo.timestamp;
                        let duration_nanos = new Long(0xFFFFFFFF, 0x7FFFFFFF);
                        duration_nanos = item.duration;
                        //Adding information regarding transaction_type and transaction_name which is transaction URL from transaction data.
                        // Capture time is extracted from transaction timestamp.
                        //start_time we get it from hostInfo. duration_nanos from transaction duration
                        let Header = {
                            partial: false,
                            slow: false,
                            async: false,
                            start_time: start_time,
                            capture_time: capture_time,
                            duration_nanos: duration_nanos,
                            transaction_type: 'App',
                            transaction_name: item.url,
                            headline: 'Test API',
                            user: 'varun',
                            attribute: [attribute],
                            detail_entry: [detail_entry],
                            error: error,
                            // main_thread_root_timer: main_thread_root_timerT,
                            // aux_thread_root_timer: [main_thread_root_timerT],
                            // async_timer: [main_thread_root_timerT],
                            // main_thread_stats: main_thread_statsT,
                            // aux_thread_stats: main_thread_statsT,
                            entry_count: errorObject.length,
                            entry_limit_exceeded: true,
                            // main_thread_profile_sample_count: main_thread_profile_sample_count,
                            // main_thread_profile_sample_limit_exceeded: false,
                            // aux_thread_profile_sample_count: aux_thread_profile_sample_count,
                            // aux_thread_profile_sample_limit_exceeded: false
                        };
                        //TODO: Node JS Profile
                        // let Profile = new collectorService.Profile();
                        // let ProfileNode = new collectorService.Profile.ProfileNode();
                        // ProfileNode = {
                        //     depth: 0,
                        //     package_name_index: 0,
                        //     class_name_index: 0,
                        //     method_name_index: 0,
                        //     file_name_index: 0,
                        //     line_number: 0,
                        //     leaf_thread_state: 0,
                        //     sample_count: Long { low: 0, high: 0, unsigned: false }
                        // }
                        // Profile = {
                        //     package_name: ['myntapm'],
                        //     class_name: ['node'],
                        //     method_name: ['profile'],
                        //     file_name: ['client'],
                        //     node: []
                        // };
                        let TraceStreamMessageTH = {
                          stream_header: null,
                          shared_query_text: null,
                          trace: null,
                          entry: null,
                          main_thread_profile: null,
                          aux_thread_profile: null,
                          header: Header,
                          stream_counts: null 
                        };

                        // let Trace = new collectorService.Trace();
                        // // For UUID we have required uuid module for node and we are generating timestamp based UUID
                        // Trace = {
                        //     id: uuidV1(),
                        //     header: Header,
                        //     entry: [],
                        //     main_thread_profile: null,
                        //     aux_thread_profile: null,
                        //     update: false,
                        //     shared_query_text: [SharedQueryText]
                        // };
                        let error_new = {
                            message: err.message,
                            exception: null
                        };
                        let entry_new = {
                            depth: 0,
                            start_offset_nanos: longVal,
                            duration_nanos: longVal,
                            active: false,
                            message: 'entry message',
                            query_entry_message: QueryEntryMessage,
                            detail_entry: [detail_entry],
                            location_stack_trace_element: [],
                            error: error_new
                        };
                        let TraceStreamMessageTE = {
                          stream_header: null,
                          shared_query_text: null,
                          trace: null,
                          entry: entry_new,
                          main_thread_profile: null,
                          aux_thread_profile: null,
                          header: null,
                          stream_counts: null 
                        };
                        let TraceStreamCounts = {
                            shared_query_text_count: 1,
                            entry_count: errorObject.length
                        };
                        let TraceStreamMessageTSC = {
                          stream_header: null,
                          shared_query_text: null,
                          trace: null,
                          entry: null,
                          main_thread_profile: null,
                          aux_thread_profile: null,
                          header: null,
                          stream_counts: TraceStreamCounts 
                        };
                        trace.write(TraceStreamMessageTH);
                        trace.write(TraceStreamMessageTSC);
                        trace.end();
                    });
                }
            });

        });
    },
    collectLogValues: function (hostInfo,error) {
        var errorList = _.values(error);
        errorList.forEach(function(item){
            let longVal = new Long(0xFFFFFFFF, 0x7FFFFFFF);
            longVal = item.timestamp;
            let LogEvent = {
                timestamp: longVal,
                level: 5,
                logger_name: item.message,
                message: item.details,
                throwable: null
            };

            let LogMessage = {
                agent_id: hostInfo.host,
                log_event: LogEvent
            };
            client.log(LogMessage, function(err, response) {
                if(err){
                    console.log('LogMessage Error',err)
                }
                else{
                    console.log('LogMessage Response',response);
                }
            });
        });
    }
}

module.exports = ClientStub;