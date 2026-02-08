'use client';

import type { IGroupItem } from 'src/types/group';
import type { IAdminItem } from 'src/types/services/admin';
import { ISchoolItem } from '@/types/services/school';

import { useState, useEffect } from 'react';

import { GroupService } from 'src/services/group';
import { AdminService } from 'src/services/admin';
import { SchoolService } from '@/services/school';

import { GroupDetailsView } from 'src/sections/group/view';


export default function GroupDetailsPage({ params }: { params: { id: string } }) {
  const [group, setGroup] = useState<IGroupItem | null>(null);
  const [allAdmins, setAllAdmins] = useState<IAdminItem[]>([]);
  const [allSchools, setAllSchools] = useState<ISchoolItem[]>([])

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        
        const [groupData, adminsResponse, schoolsResponse] = await Promise.all([
          GroupService.getById(params.id),
          AdminService.list(),
          SchoolService.list()
        ])

        if (mounted) {
          setGroup(groupData);
          setAllAdmins(adminsResponse.admins || []);
          setAllSchools(schoolsResponse.schools || []);
        }
      } catch (error) {
        console.error("Eroo ao carregar os dados:", error);
      }
    };

    fetchData()

    // GroupService.getById(params.id).then((data) => {
    //   if (mounted) setGroup(data);
    // });

    return () => {
      mounted = false;
    };
  }, [params.id]);

  return group ? <GroupDetailsView group={group} adminList={allAdmins} schoolList={allSchools} /> : null;
}
