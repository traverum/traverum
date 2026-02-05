import { Navigate, useParams } from 'react-router-dom';

// Redirect /supplier/experiences/:id/edit to /supplier/experiences/:id
export default function ExperienceFormRedirect() {
  const { id } = useParams();
  return <Navigate to={`/supplier/experiences/${id}`} replace />;
}
