import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export const successResponse = <T>(
  data: T,
  message?: string,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta,
  });
};

export const errorResponse = (
  error: string,
  status: number = 400
): NextResponse<ApiResponse> => {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
};

export const unauthorizedResponse = (
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> => {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  );
};

export const forbiddenResponse = (
  message: string = 'Forbidden'
): NextResponse<ApiResponse> => {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 403 }
  );
};

export const notFoundResponse = (
  message: string = 'Not found'
): NextResponse<ApiResponse> => {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 404 }
  );
};

export const serverErrorResponse = (
  error: string = 'Internal server error'
): NextResponse<ApiResponse> => {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: 500 }
  );
};
