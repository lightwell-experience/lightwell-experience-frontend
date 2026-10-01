import { Navigate, Route, Routes } from 'react-router-dom';

import { ErrorPage } from 'components/Error/ErrorPage';
import Test from 'Pages/Test/Test';

const AppRoutes = () => (
  <ErrorPage>
    <Routes>
      <Route index element={<Test />} />
      <Route path='*' element={<Navigate to='' replace />} />
    </Routes>
  </ErrorPage>
);

export default AppRoutes;
