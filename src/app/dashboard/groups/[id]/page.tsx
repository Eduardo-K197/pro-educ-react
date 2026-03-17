'use client';

import type { IGroupItem } from 'src/types/group';
import type { IAdminItem } from 'src/types/services/admin';
import type { ISchoolItem } from '@/types/services/school';

import { useState, useEffect } from 'react';
import { SchoolService } from '@/services/school';

import { GroupService } from 'src/services/group';
import { AdminService } from 'src/services/admin';

import { GroupDetailsView } from 'src/sections/group/view';

export default function GroupDetailsPage({ params }: { params: { id: string } }) {
  const [group, setGroup] = useState<IGroupItem | null>(null);
  const [allAdmins, setAllAdmins] = useState<IAdminItem[]>([]);
  const [allSchools, setAllSchools] = useState<ISchoolItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [groupData, adminsResponse, schoolsResponse] = await Promise.all([
          GroupService.getById(params.id),
          AdminService.list(),
          SchoolService.list(),
        ]);

        if (mounted) {
          setGroup(groupData);
          setAllSchools(schoolsResponse.schools || []);
          setAllAdmins(
            (adminsResponse.admins || []).map((admin) => ({
              id: admin.id,
              name: admin.name,
              email: admin.email,
              status: admin.status,
            }))
          );
        }
      } catch (error) {
        console.error('Erro ao carregar os dados:', error);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [params.id]);

  return group ? (
    <GroupDetailsView
      group={group}
      adminList={allAdmins}
      schoolList={allSchools}
    />
  ) : null;
}
