import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';

import '../config/api_config.dart';
import '../storage/token_storage.dart';

class ApiClient {
  ApiClient(this._tokenStorage)
    : dio = Dio(
        BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 20),
          headers: {'Content-Type': 'application/json'},
        ),
      ) {
    // 1. Cấu hình để chấp nhận chứng chỉ SSL tự ký (Self-signed certificate) tại Local
    dio.httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: () {
        final client = HttpClient();
        client.badCertificateCallback = (cert, host, port) {
          final isLocalDev =
              host == '10.0.2.2' ||
              host == 'localhost' ||
              host == '127.0.0.1' ||
              host.startsWith('192.168.');
          return isLocalDev;
        };
        return client;
      },
    );

    // 2. Thêm Log để Debug (Chỉ hiện khi đang ở chế độ Debug)
    if (kDebugMode) {
      dio.interceptors.add(
        LogInterceptor(
          requestHeader: true,
          requestBody: true,
          responseHeader: false,
          responseBody: true,
          error: true,
        ),
      );
    }

    // 3. Interceptor để tự động gắn Token vào Header
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.readToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          // Bạn có thể xử lý Logout tự động khi Token hết hạn (401) tại đây
          handler.next(error);
        },
      ),
    );
  }

  final TokenStorage _tokenStorage;
  final Dio dio;

  String messageFromError(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      
      // Kiểm tra các cấu trúc lỗi phổ biến từ Backend
      if (data is Map) {
        if (data['msg'] != null) return data['msg'].toString();
        if (data['message'] != null) return data['message'].toString();
        if (data['detail'] != null) return data['detail'].toString();
        if (data['title'] != null) return data['title'].toString();
        if (data['errors'] != null) return data['errors'].toString();
      }
      
      if (data is String && data.isNotEmpty) return data;
      
      if (error.type == DioExceptionType.connectionError) {
        return 'Không thể kết nối đến API. Hãy kiểm tra URL hoặc địa chỉ IP.';
      }
      if (error.type == DioExceptionType.connectionTimeout) {
        return 'Kết nối hết hạn (Timeout).';
      }
      
      return error.message ?? 'Yêu cầu thất bại';
    }
    return error.toString();
  }
}
