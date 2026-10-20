
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  HiUsers,
  HiBookOpen,
  HiAcademicCap,
  HiUserGroup,
} from 'react-icons/hi2';

import dashboardApi from '../../api/dashboardApi';
import StatsCard from '../../components/common/StatsCard';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString('vi-VN');

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await dashboardApi.getStats();

      if (!response.success || !response.data) {
        throw new Error('Dữ liệu trả về không hợp lệ');
      }

      setDashboard(response.data);
    } catch (err) {
      setDashboard(null);
      setError(err.message || 'Không tải được Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <Loading text="Đang tải dữ liệu từ SQL Server..." />;
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-xl border">
        <h2 className="text-xl font-bold text-red-600">
          Không tải được dữ liệu quản trị
        </h2>

        <p className="mt-3 text-gray-600">{error}</p>

        <button
          onClick={fetchDashboard}
          className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  const overview = dashboard?.overview || {};
  const recentUsers = dashboard?.recentUsers || [];
  const topCourses = dashboard?.topCourses || [];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tổng quan hệ thống E-Learning
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Số liệu được lấy trực tiếp từ SQL Server
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatsCard
          title="Tổng người dùng"
          value={formatNumber(overview.total_users)}
          icon={HiUsers}
          color="blue"
        />

        <StatsCard
          title="Học viên"
          value={formatNumber(overview.total_students)}
          icon={HiUserGroup}
          color="green"
        />

        <StatsCard
          title="Khóa học"
          value={formatNumber(overview.total_courses)}
          icon={HiBookOpen}
          color="purple"
          subtitle={`${overview.published_courses ?? 0} khóa đã phát hành`}
        />

        <StatsCard
          title="Chương trình đào tạo"
          value={formatNumber(overview.total_programs)}
          icon={HiAcademicCap}
          color="amber"
        />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card title="Người dùng mới nhất">
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Chưa có người dùng.
            </p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center border-b pb-3"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>

                  <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/admin/users"
            className="block mt-4 text-blue-600 text-sm font-semibold"
          >
            Quản lý người dùng →
          </Link>
        </Card>

        <Card title="Khóa học có nhiều học viên">
          {topCourses.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Chưa có khóa học.
            </p>
          ) : (
            <div className="space-y-3">
              {topCourses.map((course) => (
                <div
                  key={course.id}
                  className="border-b pb-3"
                >
                  <p className="font-semibold text-gray-800">
                    {course.title}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Giáo viên: {course.teacher_name}
                  </p>

                  <p className="text-xs text-blue-600 mt-1">
                    {formatNumber(course.total_students)} học viên
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-bold text-gray-800 mb-4">
          Thống kê hoạt động
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm">Lượt ghi danh</p>
            <p className="text-2xl font-bold">
              {formatNumber(overview.total_enrollments)}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm">Lượt thi</p>
            <p className="text-2xl font-bold">
              {formatNumber(overview.total_exam_attempts)}
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm">Giáo viên</p>
            <p className="text-2xl font-bold">
              {formatNumber(overview.total_teachers)}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
