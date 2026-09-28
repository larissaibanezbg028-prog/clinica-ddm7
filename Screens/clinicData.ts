export type Doctor = {
    id: string;
    name: string;
    crm: string;
    specialty: string;
    initials: string;
};

export const specialties = ['Clínica geral', 'Cardiologia', 'Dermatologia', 'Pediatria', 'Ortopedia'];

export const doctors: Doctor[] = [
    { id: 'sample-marina', name: 'Dra. Marina Costa', crm: 'CRM/UF a cadastrar', specialty: 'Clínica geral', initials: 'MC' },
    { id: 'sample-rafael', name: 'Dr. Rafael Mendes', crm: 'CRM/UF a cadastrar', specialty: 'Cardiologia', initials: 'RM' },
    { id: 'sample-camila', name: 'Dra. Camila Duarte', crm: 'CRM/UF a cadastrar', specialty: 'Dermatologia', initials: 'CD' },
    { id: 'sample-beatriz', name: 'Dra. Beatriz Lima', crm: 'CRM/UF a cadastrar', specialty: 'Pediatria', initials: 'BL' },
    { id: 'sample-andre', name: 'Dr. André Nogueira', crm: 'CRM/UF a cadastrar', specialty: 'Ortopedia', initials: 'AN' },
];